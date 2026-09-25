import { dbService } from '../server/db.ts';
import { TournamentEngine } from '../server/tournamentEngine.ts';
import { SECRET_MYSTERY_MAPPING } from '../server/constants.ts';
import { TeamId } from '../server/types.ts';

async function runTests() {
  console.log('=== STARTING TOURNAMENT ENGINE AUTOMATED TEST SUITE ===\n');

  const admin = { id: 'user_admin', username: 'admin' };

  // Helper to reset
  await TournamentEngine.resetEntireTournament(admin);

  // ----------------------------------------------------
  // TEST 1: Secret Mystery Box Mapping Protection & Correctness
  // ----------------------------------------------------
  console.log('Test 1: Verify exact secret mystery box mappings...');
  const expectedMappings: Record<number, TeamId> = {
    1: 'F',
    2: 'C',
    3: 'H',
    4: 'A',
    5: 'G',
    6: 'D',
    7: 'B',
    8: 'E',
  };

  for (const [boxStr, expectedTeam] of Object.entries(expectedMappings)) {
    const boxNum = Number(boxStr);
    if (SECRET_MYSTERY_MAPPING[boxNum] !== expectedTeam) {
      throw new Error(`Box ${boxNum} mapped to ${SECRET_MYSTERY_MAPPING[boxNum]} instead of ${expectedTeam}`);
    }
  }
  console.log('✓ Secret mapping matches specification exactly.\n');

  // ----------------------------------------------------
  // TEST 2: Mystery Draw Concurrency & Selection
  // ----------------------------------------------------
  console.log('Test 2: Concurrency & atomic mystery box selection...');
  // Open draw
  await TournamentEngine.openMysterySelection(admin);

  // Simultaneous claims on Box 4 by two users
  const user1 = { id: 'user_team_a', username: 'team_a', teamId: 'A' as TeamId };
  const user2 = { id: 'user_team_b', username: 'team_b', teamId: 'B' as TeamId };

  const [res1, res2] = await Promise.allSettled([
    TournamentEngine.claimMysteryBox(4, user1),
    TournamentEngine.claimMysteryBox(4, user2),
  ]);

  const successCount = [res1, res2].filter((r) => r.status === 'fulfilled').length;
  const rejectedCount = [res1, res2].filter((r) => r.status === 'rejected').length;

  if (successCount !== 1 || rejectedCount !== 1) {
    throw new Error(`Concurrency test failed: successCount=${successCount}, rejectedCount=${rejectedCount}`);
  }

  const rejectedReason = (res1.status === 'rejected' ? res1.reason : (res2 as any).reason).message;
  console.log(`✓ Concurrent claim: One succeeded, one rejected with: "${rejectedReason}"`);

  // Now claim the remaining 7 boxes with the remaining teams
  const remainingAssignments: Array<{ box: number; user: { id: string; username: string; teamId: TeamId } }> = [
    { box: 1, user: { id: 'user_team_f', username: 'team_f', teamId: 'F' } },
    { box: 2, user: { id: 'user_team_c', username: 'team_c', teamId: 'C' } },
    { box: 3, user: { id: 'user_team_h', username: 'team_h', teamId: 'H' } },
    { box: 5, user: { id: 'user_team_g', username: 'team_g', teamId: 'G' } },
    { box: 6, user: { id: 'user_team_d', username: 'team_d', teamId: 'D' } },
    { box: 7, user: { id: 'user_team_b', username: 'team_b', teamId: 'B' } },
    { box: 8, user: { id: 'user_team_e', username: 'team_e', teamId: 'E' } },
  ];

  for (const item of remainingAssignments) {
    await TournamentEngine.claimMysteryBox(item.box, item.user);
  }

  const stateAfterDraw = TournamentEngine.getPublicState();
  if (stateAfterDraw.metadata.state !== 'MYSTERY_DRAW_COMPLETED') {
    throw new Error(`Expected state MYSTERY_DRAW_COMPLETED, got: ${stateAfterDraw.metadata.state}`);
  }
  console.log('✓ All 8 boxes claimed. State automatically transitioned to MYSTERY_DRAW_COMPLETED.');

  // VERIFY M1-M4 TEAMS CHANGED FROM DEFAULT TO MYSTERY DRAW FIXTURES:
  const m1Drawn = stateAfterDraw.matches.find((m) => m.id === 'M1')!;
  const m2Drawn = stateAfterDraw.matches.find((m) => m.id === 'M2')!;
  const m3Drawn = stateAfterDraw.matches.find((m) => m.id === 'M3')!;
  const m4Drawn = stateAfterDraw.matches.find((m) => m.id === 'M4')!;

  if (m1Drawn.team1Id !== 'F' || m1Drawn.team2Id !== 'C') {
    throw new Error(`M1 fixture failure! Expected F vs C, got: ${m1Drawn.team1Id} vs ${m1Drawn.team2Id}`);
  }
  if (m2Drawn.team1Id !== 'H' || m2Drawn.team2Id !== 'A') {
    throw new Error(`M2 fixture failure! Expected H vs A, got: ${m2Drawn.team1Id} vs ${m2Drawn.team2Id}`);
  }
  if (m3Drawn.team1Id !== 'G' || m3Drawn.team2Id !== 'D') {
    throw new Error(`M3 fixture failure! Expected G vs D, got: ${m3Drawn.team1Id} vs ${m3Drawn.team2Id}`);
  }
  if (m4Drawn.team1Id !== 'B' || m4Drawn.team2Id !== 'E') {
    throw new Error(`M4 fixture failure! Expected B vs E, got: ${m4Drawn.team1Id} vs ${m4Drawn.team2Id}`);
  }

  console.log('✓ VERIFIED: Default teams for M1-M4 successfully changed after mystery draw:');
  console.log('    M1 changed from (A vs B) to -> Team F (Anbu Vagaira) vs Team C (Super Strikers)');
  console.log('    M2 changed from (C vs D) to -> Team H (Nanga 4 La Pathi Peru) vs Team A (Duo Devils)');
  console.log('    M3 changed from (E vs F) to -> Team G (2-Peru Modhi Paaru) vs Team D (Ayan)');
  console.log('    M4 changed from (G vs H) to -> Team B (RCC) vs Team E (Idi Minnal)\n');

  // Verify Reset Mystery Draw returns to Default Fixtures
  console.log('Test 2b: Verify reset mystery draw reverts M1-M4 to default fixtures...');
  await TournamentEngine.resetMysteryDraw(admin);
  const stateAfterReset = TournamentEngine.getPublicState();
  const m1Reset = stateAfterReset.matches.find((m) => m.id === 'M1')!;
  const m2Reset = stateAfterReset.matches.find((m) => m.id === 'M2')!;
  const m3Reset = stateAfterReset.matches.find((m) => m.id === 'M3')!;
  const m4Reset = stateAfterReset.matches.find((m) => m.id === 'M4')!;

  if (m1Reset.team1Id !== 'A' || m1Reset.team2Id !== 'B') {
    throw new Error(`M1 did not revert to default (A vs B)! Got: ${m1Reset.team1Id} vs ${m1Reset.team2Id}`);
  }
  if (m2Reset.team1Id !== 'C' || m2Reset.team2Id !== 'D') {
    throw new Error(`M2 did not revert to default (C vs D)! Got: ${m2Reset.team1Id} vs ${m2Reset.team2Id}`);
  }
  if (m3Reset.team1Id !== 'E' || m3Reset.team2Id !== 'F') {
    throw new Error(`M3 did not revert to default (E vs F)! Got: ${m3Reset.team1Id} vs ${m3Reset.team2Id}`);
  }
  if (m4Reset.team1Id !== 'G' || m4Reset.team2Id !== 'H') {
    throw new Error(`M4 did not revert to default (G vs H)! Got: ${m4Reset.team1Id} vs ${m4Reset.team2Id}`);
  }
  console.log('✓ VERIFIED: Resetting mystery draw correctly restored default teams (A vs B, C vs D, E vs F, G vs H).\n');

  // Verify Admin Auto-Draw capability
  console.log('Test 2c: Verify Admin auto-draw for all mystery boxes...');
  await TournamentEngine.autoDrawAllMysteryBoxes(admin);
  const stateAfterAuto = TournamentEngine.getPublicState();
  if (stateAfterAuto.metadata.state !== 'MYSTERY_DRAW_COMPLETED') {
    throw new Error('Auto-draw failed to transition to MYSTERY_DRAW_COMPLETED');
  }
  const m1Auto = stateAfterAuto.matches.find((m) => m.id === 'M1')!;
  if (m1Auto.team1Id !== 'F' || m1Auto.team2Id !== 'C') {
    throw new Error('Auto-draw failed to set M1 to F vs C');
  }
  console.log('✓ VERIFIED: Admin auto-draw executed and updated M1-M4 fixtures.\n');

  // Now reset entire tournament to default setup for canonical bracket progression simulation
  await TournamentEngine.resetEntireTournament(admin);

  // ----------------------------------------------------
  // TEST 3: Tournament Start & Round 1 Matches
  // ----------------------------------------------------
  console.log('Test 3: Start tournament and verify Round 1 readiness...');
  await TournamentEngine.startTournament(admin);
  const stateAtStart = TournamentEngine.getPublicState();
  if (stateAtStart.metadata.state !== 'QUALIFICATION_ACTIVE') {
    throw new Error(`Expected QUALIFICATION_ACTIVE, got ${stateAtStart.metadata.state}`);
  }

  const r1Ready = ['M1', 'M2', 'M3', 'M4'].every((id) => {
    const m = stateAtStart.matches.find((match) => match.id === id);
    return m && m.status === 'READY';
  });

  if (!r1Ready) {
    throw new Error('M1 - M4 are not all READY');
  }
  console.log('✓ Tournament started. M1 - M4 are all READY.\n');

  // ----------------------------------------------------
  // TEST 4: Result Recording, 2-Consecutive-Wins Qualification & Elimination
  // ----------------------------------------------------
  console.log('Test 4: Simulating full qualification path (M1 to M13)...');

  // M1: A vs B -> A wins!
  await TournamentEngine.recordMatchResult('M1', 'A', admin);
  // M2: C vs D -> C wins!
  await TournamentEngine.recordMatchResult('M2', 'C', admin);
  // M3: E vs F -> E wins!
  await TournamentEngine.recordMatchResult('M3', 'E', admin);
  // M4: G vs H -> G wins!
  await TournamentEngine.recordMatchResult('M4', 'G', admin);

  const stateAfterR1 = TournamentEngine.getPublicState();
  const m5 = stateAfterR1.matches.find((m) => m.id === 'M5')!;
  const m7 = stateAfterR1.matches.find((m) => m.id === 'M7')!;

  if (m5.team1Id !== 'A' || m5.team2Id !== 'C' || m5.status !== 'READY') {
    throw new Error(`M5 dependency resolution failed: team1=${m5.team1Id}, team2=${m5.team2Id}, status=${m5.status}`);
  }
  if (m7.team1Id !== 'B' || m7.team2Id !== 'D' || m7.status !== 'READY') {
    throw new Error(`M7 dependency resolution failed: team1=${m7.team1Id}, team2=${m7.team2Id}, status=${m7.status}`);
  }
  console.log('✓ Round 1 completed. M5 (A vs C) and M7 (B vs D) resolved and READY.');

  // M5: A vs C -> A wins! (A has 2 consecutive wins: won M1, won M5 -> Q1!)
  await TournamentEngine.recordMatchResult('M5', 'A', admin);
  const stateAfterM5 = TournamentEngine.getPublicState();
  const teamA = stateAfterM5.teams.find((t) => t.id === 'A')!;
  if (teamA.status !== 'QUALIFIED' || teamA.qualifiedSlot !== 'Q1' || teamA.consecutiveWins !== 2) {
    throw new Error(`Team A did not qualify as Q1: status=${teamA.status}, slot=${teamA.qualifiedSlot}, consecWins=${teamA.consecutiveWins}`);
  }
  console.log('✓ Team A qualifies as Q1 with 2 consecutive wins!');

  // M6: E vs G -> E wins! (E has 2 consecutive wins: won M3, won M6 -> Q2!)
  await TournamentEngine.recordMatchResult('M6', 'E', admin);
  const stateAfterM6 = TournamentEngine.getPublicState();
  const teamE = stateAfterM6.teams.find((t) => t.id === 'E')!;
  if (teamE.status !== 'QUALIFIED' || teamE.qualifiedSlot !== 'Q2' || teamE.consecutiveWins !== 2) {
    throw new Error(`Team E did not qualify as Q2: status=${teamE.status}, slot=${teamE.qualifiedSlot}`);
  }
  console.log('✓ Team E qualifies as Q2 with 2 consecutive wins!');

  // M7: B vs D -> B wins! D loses (D has 2 losses: lost M2, lost M7 -> E1 / eliminated!)
  await TournamentEngine.recordMatchResult('M7', 'B', admin);
  const stateAfterM7 = TournamentEngine.getPublicState();
  const teamD = stateAfterM7.teams.find((t) => t.id === 'D')!;
  if (teamD.status !== 'ELIMINATED' || teamD.eliminatedSlot !== 'E1' || teamD.losses !== 2) {
    throw new Error(`Team D did not get eliminated as E1: status=${teamD.status}, slot=${teamD.eliminatedSlot}`);
  }
  console.log('✓ Team D eliminated as E1 with 2 losses.');

  // M8: F vs H -> F wins! H loses (H has 2 losses -> E2 / eliminated!)
  await TournamentEngine.recordMatchResult('M8', 'F', admin);
  const stateAfterM8 = TournamentEngine.getPublicState();
  const teamH = stateAfterM8.teams.find((t) => t.id === 'H')!;
  if (teamH.status !== 'ELIMINATED' || teamH.eliminatedSlot !== 'E2' || teamH.losses !== 2) {
    throw new Error(`Team H did not get eliminated as E2: status=${teamH.status}, slot=${teamH.eliminatedSlot}`);
  }
  console.log('✓ Team H eliminated as E2 with 2 losses.');

  // Round 3:
  // M9: L(M5) vs W(M8) = C vs F
  // M10: L(M6) vs W(M7) = G vs B
  const stateAfterR2 = TournamentEngine.getPublicState();
  const m9 = stateAfterR2.matches.find((m) => m.id === 'M9')!;
  const m10 = stateAfterR2.matches.find((m) => m.id === 'M10')!;

  if (m9.team1Id !== 'C' || m9.team2Id !== 'F' || m9.status !== 'READY') {
    throw new Error(`M9 resolution error: team1=${m9.team1Id}, team2=${m9.team2Id}`);
  }
  if (m10.team1Id !== 'G' || m10.team2Id !== 'B' || m10.status !== 'READY') {
    throw new Error(`M10 resolution error: team1=${m10.team1Id}, team2=${m10.team2Id}`);
  }
  console.log('✓ Round 3 matches M9 (C vs F) and M10 (G vs B) resolved and READY.');

  // Play M9: C vs F -> C wins! (C qualifies as Q3, F eliminated as E3)
  await TournamentEngine.recordMatchResult('M9', 'C', admin);
  const stateAfterM9 = TournamentEngine.getPublicState();
  const teamC = stateAfterM9.teams.find((t) => t.id === 'C')!;
  const teamF = stateAfterM9.teams.find((t) => t.id === 'F')!;
  if (teamC.status !== 'QUALIFIED' || teamC.qualifiedSlot !== 'Q3') {
    throw new Error(`Team C did not qualify as Q3: status=${teamC.status}`);
  }
  if (teamF.status !== 'ELIMINATED' || teamF.eliminatedSlot !== 'E3') {
    throw new Error(`Team F did not get eliminated as E3: status=${teamF.status}`);
  }
  console.log('✓ Team C qualifies as Q3! Team F eliminated as E3.');

  // Play M10: G vs B -> B wins! (B qualifies as Q4, G eliminated as E4)
  await TournamentEngine.recordMatchResult('M10', 'B', admin);
  const stateAfterM10 = TournamentEngine.getPublicState();
  const teamB = stateAfterM10.teams.find((t) => t.id === 'B')!;
  const teamG = stateAfterM10.teams.find((t) => t.id === 'G')!;
  if (teamB.status !== 'QUALIFIED' || teamB.qualifiedSlot !== 'Q4') {
    throw new Error(`Team B did not qualify as Q4: status=${teamB.status}`);
  }
  if (teamG.status !== 'ELIMINATED' || teamG.eliminatedSlot !== 'E4') {
    throw new Error(`Team G did not get eliminated as E4: status=${teamG.status}`);
  }
  console.log('✓ Team B qualifies as Q4! Team G eliminated as E4.');

  // ----------------------------------------------------
  // TEST 5: Verify Qualification Concluded & Semifinals Setup
  // ----------------------------------------------------
  console.log('Test 5: Verify all 4 qualifiers and Semifinal matchups...');
  const { Q1, Q2, Q3, Q4 } = stateAfterM10.qualifiers;
  if (!Q1 || !Q2 || !Q3 || !Q4) {
    throw new Error('Not all 4 qualifiers are determined');
  }
  console.log(`✓ Qualifiers confirmed: Q1=${Q1.id} (${Q1.name}), Q2=${Q2.id} (${Q2.name}), Q3=${Q3.id} (${Q3.name}), Q4=${Q4.id} (${Q4.name})`);

  // Semifinals:
  // SF1: Q1 vs Q4 -> A vs B
  // SF2: Q2 vs Q3 -> E vs C
  const sf1 = stateAfterM10.matches.find((m) => m.id === 'SF1')!;
  const sf2 = stateAfterM10.matches.find((m) => m.id === 'SF2')!;

  if (sf1.team1Id !== 'A' || sf1.team2Id !== 'B' || sf1.status !== 'READY') {
    throw new Error(`SF1 mismatch: team1=${sf1.team1Id}, team2=${sf1.team2Id}, status=${sf1.status}`);
  }
  if (sf2.team1Id !== 'E' || sf2.team2Id !== 'C' || sf2.status !== 'READY') {
    throw new Error(`SF2 mismatch: team1=${sf2.team1Id}, team2=${sf2.team2Id}, status=${sf2.status}`);
  }
  console.log('✓ SF1 (Q1 vs Q4: A vs B) and SF2 (Q2 vs Q3: E vs C) READY to play!');

  // ----------------------------------------------------
  // TEST 6: Play Semifinals, Third Place Match & Championship Final
  // ----------------------------------------------------
  console.log('Test 6: Semifinals, Bronze Decider, and Grand Final...');
  // SF1: A vs B -> A wins!
  await TournamentEngine.recordMatchResult('SF1', 'A', admin);
  // SF2: E vs C -> C wins!
  await TournamentEngine.recordMatchResult('SF2', 'C', admin);

  const stateAfterSF = TournamentEngine.getPublicState();
  const tp = stateAfterSF.matches.find((m) => m.id === 'TP')!;
  const final = stateAfterSF.matches.find((m) => m.id === 'FINAL')!;

  // TP: Loser SF1 vs Loser SF2 = B vs E
  if (tp.team1Id !== 'B' || tp.team2Id !== 'E' || tp.status !== 'READY') {
    throw new Error(`Third Place match mismatch: team1=${tp.team1Id}, team2=${tp.team2Id}`);
  }

  // FINAL: Winner SF1 vs Winner SF2 = A vs C
  if (final.team1Id !== 'A' || final.team2Id !== 'C' || final.status !== 'READY') {
    throw new Error(`Final match mismatch: team1=${final.team1Id}, team2=${final.team2Id}`);
  }
  console.log('✓ Third Place Match (B vs E) and Final (A vs C) populated and READY.');

  // Play Third Place Match: B vs E -> B wins!
  await TournamentEngine.recordMatchResult('TP', 'B', admin);
  const stateAfterTP = TournamentEngine.getPublicState();
  if (stateAfterTP.podium.thirdPlace?.id !== 'B') {
    throw new Error(`Third place team mismatch: ${stateAfterTP.podium.thirdPlace?.id}`);
  }
  console.log('✓ Third place awarded to Team B (RCC)!');

  // Play Championship Final: A vs C -> A wins!
  await TournamentEngine.recordMatchResult('FINAL', 'A', admin);
  const finalState = TournamentEngine.getPublicState();

  if (finalState.metadata.state !== 'COMPLETED') {
    throw new Error(`Expected COMPLETED state, got: ${finalState.metadata.state}`);
  }
  if (finalState.podium.champion?.id !== 'A') {
    throw new Error(`Champion mismatch: ${finalState.podium.champion?.id}`);
  }
  if (finalState.podium.runnerUp?.id !== 'C') {
    throw new Error(`Runner-up mismatch: ${finalState.podium.runnerUp?.id}`);
  }

  console.log('\n🏆 TOURNAMENT COMPLETED SUCCESSFULLY! 🏆');
  console.log(`🥇 CHAMPION: Team ${finalState.podium.champion.id} — ${finalState.podium.champion.name}`);
  console.log(`🥈 RUNNER-UP: Team ${finalState.podium.runnerUp.id} — ${finalState.podium.runnerUp.name}`);
  console.log(`🥉 THIRD PLACE: Team ${finalState.podium.thirdPlace?.id} — ${finalState.podium.thirdPlace?.name}`);
  console.log(`4TH PLACE: Team ${finalState.podium.fourthPlace?.id} — ${finalState.podium.fourthPlace?.name}`);

  // ----------------------------------------------------
  // TEST 7: Negative Validation (Playing completed matches or invalid winners)
  // ----------------------------------------------------
  console.log('\nTest 7: Validating negative error cases and safety guards...');
  try {
    await TournamentEngine.recordMatchResult('FINAL', 'C', admin);
    throw new Error('Should have rejected result for completed match');
  } catch (err: any) {
    console.log(`✓ Completed match rejection verified: "${err.message}"`);
  }

  console.log('\n=== ALL TEST SCENARIOS PASSED WITH 100% SUCCESS ===\n');
}

runTests().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
