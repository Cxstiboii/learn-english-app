insert into public.placement_questions
  (id, level, skill, prompt, options, correct_option, explanation)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'A2',
    'grammar',
    'Maya ___ the team dashboard every morning before stand-up.',
    jsonb_build_array(
      jsonb_build_object('id', 'A', 'text', 'check'),
      jsonb_build_object('id', 'B', 'text', 'checks'),
      jsonb_build_object('id', 'C', 'text', 'checking'),
      jsonb_build_object('id', 'D', 'text', 'checked')
    ),
    'B',
    'Use the present simple with -s for a third-person singular subject: “Maya checks.”'
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'A2',
    'grammar',
    'We ___ the bug yesterday and sent the fix for review.',
    jsonb_build_array(
      jsonb_build_object('id', 'A', 'text', 'find'),
      jsonb_build_object('id', 'B', 'text', 'found'),
      jsonb_build_object('id', 'C', 'text', 'have find'),
      jsonb_build_object('id', 'D', 'text', 'are finding')
    ),
    'B',
    '“Yesterday” marks a finished past time, so use the past simple “found.”'
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'A2',
    'vocabulary',
    'The test server is ___ after 6 p.m., so you can use it then.',
    jsonb_build_array(
      jsonb_build_object('id', 'A', 'text', 'available'),
      jsonb_build_object('id', 'B', 'text', 'careful'),
      jsonb_build_object('id', 'C', 'text', 'similar'),
      jsonb_build_object('id', 'D', 'text', 'expensive')
    ),
    'A',
    '“Available” means ready for someone to use.'
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    'A2',
    'vocabulary',
    'The app stops opening on older phones. We need to ___ this problem.',
    jsonb_build_array(
      jsonb_build_object('id', 'A', 'text', 'invite'),
      jsonb_build_object('id', 'B', 'text', 'fix'),
      jsonb_build_object('id', 'C', 'text', 'borrow'),
      jsonb_build_object('id', 'D', 'text', 'describe')
    ),
    'B',
    '“Fix a problem” means make the problem go away or work correctly again.'
  ),
  (
    '00000000-0000-4000-8000-000000000005',
    'A2',
    'reading',
    'Read the note: “The support team is moving its weekly meeting from Tuesday to Thursday. The time will stay the same.” When is the meeting now?',
    jsonb_build_array(
      jsonb_build_object('id', 'A', 'text', 'Tuesday at a new time'),
      jsonb_build_object('id', 'B', 'text', 'Thursday at the same time'),
      jsonb_build_object('id', 'C', 'text', 'Every Thursday at a new time'),
      jsonb_build_object('id', 'D', 'text', 'Tuesday at the same time')
    ),
    'B',
    'The note says the day changes to Thursday and the time stays the same.'
  ),
  (
    '00000000-0000-4000-8000-000000000006',
    'A2',
    'reading',
    'Read the message: “I finished the first draft of the help page. I will add screenshots tomorrow.” What has the writer already done?',
    jsonb_build_array(
      jsonb_build_object('id', 'A', 'text', 'Added all the screenshots'),
      jsonb_build_object('id', 'B', 'text', 'Finished the first draft'),
      jsonb_build_object('id', 'C', 'text', 'Published the help page'),
      jsonb_build_object('id', 'D', 'text', 'Asked someone to write the page')
    ),
    'B',
    'The writer says the first draft is finished; adding screenshots is a future task.'
  ),
  (
    '00000000-0000-4000-8000-000000000007',
    'B1',
    'grammar',
    'We ___ this endpoint twice since Monday, and both tests passed.',
    jsonb_build_array(
      jsonb_build_object('id', 'A', 'text', 'tested'),
      jsonb_build_object('id', 'B', 'text', 'have tested'),
      jsonb_build_object('id', 'C', 'text', 'are testing'),
      jsonb_build_object('id', 'D', 'text', 'will test')
    ),
    'B',
    '“Since Monday” connects a past starting point to the present, so the present perfect fits.'
  ),
  (
    '00000000-0000-4000-8000-000000000008',
    'B1',
    'grammar',
    'If the build ___ again, we will check the latest dependency change.',
    jsonb_build_array(
      jsonb_build_object('id', 'A', 'text', 'fail'),
      jsonb_build_object('id', 'B', 'text', 'fails'),
      jsonb_build_object('id', 'C', 'text', 'failed'),
      jsonb_build_object('id', 'D', 'text', 'will failing')
    ),
    'B',
    'In a first conditional, use the present simple in the if-clause: “If the build fails, we will check…”'
  ),
  (
    '00000000-0000-4000-8000-000000000009',
    'B1',
    'vocabulary',
    'The service stayed online during the busy period. It was very ___.',
    jsonb_build_array(
      jsonb_build_object('id', 'A', 'text', 'reliable'),
      jsonb_build_object('id', 'B', 'text', 'narrow'),
      jsonb_build_object('id', 'C', 'text', 'temporary'),
      jsonb_build_object('id', 'D', 'text', 'silent')
    ),
    'A',
    '“Reliable” describes something that works well consistently.'
  ),
  (
    '00000000-0000-4000-8000-000000000010',
    'B1',
    'vocabulary',
    'The team agreed to finish the documentation by Friday. Friday is the ___.',
    jsonb_build_array(
      jsonb_build_object('id', 'A', 'text', 'shortcut'),
      jsonb_build_object('id', 'B', 'text', 'deadline'),
      jsonb_build_object('id', 'C', 'text', 'receipt'),
      jsonb_build_object('id', 'D', 'text', 'feature')
    ),
    'B',
    'A “deadline” is the latest time or date by which something should be completed.'
  ),
  (
    '00000000-0000-4000-8000-000000000011',
    'B1',
    'reading',
    'Read the email: “Hi Lee, I reviewed the draft. The examples are clear, but the setup instructions need one more step for Windows users. Please add it before we publish.” What change does Lee need to make?',
    jsonb_build_array(
      jsonb_build_object('id', 'A', 'text', 'Rewrite all the examples'),
      jsonb_build_object('id', 'B', 'text', 'Add a Windows setup step'),
      jsonb_build_object('id', 'C', 'text', 'Publish the draft immediately'),
      jsonb_build_object('id', 'D', 'text', 'Remove the setup instructions')
    ),
    'B',
    'The reviewer specifically asks Lee to add one setup step for Windows users before publication.'
  ),
  (
    '00000000-0000-4000-8000-000000000012',
    'B1',
    'reading',
    'Read the update: “I completed the login screen this morning. The profile page is still blocked because the design team has not shared the final layout.” What is preventing work on the profile page?',
    jsonb_build_array(
      jsonb_build_object('id', 'A', 'text', 'The login screen is incomplete'),
      jsonb_build_object('id', 'B', 'text', 'The final design layout is missing'),
      jsonb_build_object('id', 'C', 'text', 'The profile page is already finished'),
      jsonb_build_object('id', 'D', 'text', 'The design team needs a code review')
    ),
    'B',
    'The update says work is blocked until the design team shares the final layout.'
  ),
  (
    '00000000-0000-4000-8000-000000000013',
    'B1+',
    'grammar',
    'If we ___ more time, we would add automated checks for every supported browser.',
    jsonb_build_array(
      jsonb_build_object('id', 'A', 'text', 'have'),
      jsonb_build_object('id', 'B', 'text', 'had'),
      jsonb_build_object('id', 'C', 'text', 'will have'),
      jsonb_build_object('id', 'D', 'text', 'would have')
    ),
    'B',
    'The second conditional uses past simple in the if-clause and “would” in the result clause.'
  ),
  (
    '00000000-0000-4000-8000-000000000014',
    'B1+',
    'grammar',
    'By the time the incident call began, Nina ___ the release until Monday because a test was still failing.',
    jsonb_build_array(
      jsonb_build_object('id', 'A', 'text', 'postpones'),
      jsonb_build_object('id', 'B', 'text', 'has postponed'),
      jsonb_build_object('id', 'C', 'text', 'had postponed'),
      jsonb_build_object('id', 'D', 'text', 'will postpone')
    ),
    'C',
    'The postponement happened before the incident call began, so use the past perfect “had postponed.”'
  ),
  (
    '00000000-0000-4000-8000-000000000015',
    'B1+',
    'vocabulary',
    'The team added a temporary cache to ___ the impact of the slow database during peak hours.',
    jsonb_build_array(
      jsonb_build_object('id', 'A', 'text', 'mitigate'),
      jsonb_build_object('id', 'B', 'text', 'predict'),
      jsonb_build_object('id', 'C', 'text', 'publish'),
      jsonb_build_object('id', 'D', 'text', 'compare')
    ),
    'A',
    '“Mitigate” means reduce the severity or harmful effect of a problem.'
  ),
  (
    '00000000-0000-4000-8000-000000000016',
    'B1+',
    'vocabulary',
    'The first deployment failed, but the team ___ found the configuration error and fixed it.',
    jsonb_build_array(
      jsonb_build_object('id', 'A', 'text', 'eventually'),
      jsonb_build_object('id', 'B', 'text', 'currently'),
      jsonb_build_object('id', 'C', 'text', 'rarely'),
      jsonb_build_object('id', 'D', 'text', 'nearly')
    ),
    'A',
    '“Eventually” means after some time or after a delay, which fits the sequence of events.'
  ),
  (
    '00000000-0000-4000-8000-000000000017',
    'B1+',
    'reading',
    'Read the update: “The new search is faster on desktop, whereas mobile results take about the same time as before. We are testing a smaller index to improve mobile performance.” Which statement is accurate?',
    jsonb_build_array(
      jsonb_build_object('id', 'A', 'text', 'Search improved equally on desktop and mobile'),
      jsonb_build_object('id', 'B', 'text', 'Desktop search is faster, and mobile performance is still being worked on'),
      jsonb_build_object('id', 'C', 'text', 'The team stopped testing mobile search'),
      jsonb_build_object('id', 'D', 'text', 'The smaller index has already solved the mobile issue')
    ),
    'B',
    'The update contrasts faster desktop results with unchanged mobile timing and says mobile work is ongoing.'
  ),
  (
    '00000000-0000-4000-8000-000000000018',
    'B1+',
    'reading',
    'Read the incident note: “Error rates rose after the new cache was enabled. Disabling it returned error rates to normal, although page loads are now slightly slower.” What was the trade-off after the mitigation?',
    jsonb_build_array(
      jsonb_build_object('id', 'A', 'text', 'Normal error rates, but slower page loads'),
      jsonb_build_object('id', 'B', 'text', 'Higher error rates and faster page loads'),
      jsonb_build_object('id', 'C', 'text', 'Normal error rates and faster page loads'),
      jsonb_build_object('id', 'D', 'text', 'The cache remained enabled with no changes')
    ),
    'A',
    'Disabling the cache restored normal error rates, while page loads became slightly slower.'
  ),
  (
    '00000000-0000-4000-8000-000000000019',
    'B2',
    'grammar',
    'Had the team ___ the migration against a larger dataset, they might have caught the performance issue earlier.',
    jsonb_build_array(
      jsonb_build_object('id', 'A', 'text', 'tested'),
      jsonb_build_object('id', 'B', 'text', 'test'),
      jsonb_build_object('id', 'C', 'text', 'testing'),
      jsonb_build_object('id', 'D', 'text', 'been test')
    ),
    'A',
    'This inverted third conditional uses “Had + subject + past participle”: “Had the team tested…”'
  ),
  (
    '00000000-0000-4000-8000-000000000020',
    'B2',
    'grammar',
    'Despite ___ the integration tests locally, the team found a configuration issue in staging.',
    jsonb_build_array(
      jsonb_build_object('id', 'A', 'text', 'run'),
      jsonb_build_object('id', 'B', 'text', 'to run'),
      jsonb_build_object('id', 'C', 'text', 'running'),
      jsonb_build_object('id', 'D', 'text', 'they ran')
    ),
    'C',
    '“Despite” is a preposition and is followed here by a gerund: “Despite running…”'
  ),
  (
    '00000000-0000-4000-8000-000000000021',
    'B2',
    'vocabulary',
    'This API version will remain available for six months, after which it will be ___ and clients should use the new version.',
    jsonb_build_array(
      jsonb_build_object('id', 'A', 'text', 'deployed'),
      jsonb_build_object('id', 'B', 'text', 'deprecated'),
      jsonb_build_object('id', 'C', 'text', 'compiled'),
      jsonb_build_object('id', 'D', 'text', 'retrieved')
    ),
    'B',
    'A deprecated API is marked as no longer recommended, often before it is eventually removed.'
  ),
  (
    '00000000-0000-4000-8000-000000000022',
    'B2',
    'vocabulary',
    'Given the current budget and timeline, a complete rewrite is not ___; we should improve the existing service instead.',
    jsonb_build_array(
      jsonb_build_object('id', 'A', 'text', 'feasible'),
      jsonb_build_object('id', 'B', 'text', 'accurate'),
      jsonb_build_object('id', 'C', 'text', 'mandatory'),
      jsonb_build_object('id', 'D', 'text', 'consistent')
    ),
    'A',
    '“Feasible” means possible or practical under the given conditions.'
  ),
  (
    '00000000-0000-4000-8000-000000000023',
    'B2',
    'reading',
    'Read the release summary: “The team moved image processing to a background queue. Requests now return sooner, but a small number of users may see updated images several seconds later. The team will monitor queue delays this week.” What is the main consequence of the change?',
    jsonb_build_array(
      jsonb_build_object('id', 'A', 'text', 'Requests are faster, though some image updates may be delayed'),
      jsonb_build_object('id', 'B', 'text', 'All image processing has stopped'),
      jsonb_build_object('id', 'C', 'text', 'Users must wait longer before every request returns'),
      jsonb_build_object('id', 'D', 'text', 'The team has confirmed that queue delays cannot occur')
    ),
    'A',
    'Moving work to a background queue speeds up responses but can delay when updated images appear.'
  ),
  (
    '00000000-0000-4000-8000-000000000024',
    'B2',
    'reading',
    'Read the proposal: “The service currently retries every failed request immediately. This can overload the database during an outage. We propose exponential backoff, which spaces out retries, while keeping a maximum retry limit so requests do not remain pending indefinitely.” Why does the proposal include a maximum retry limit?',
    jsonb_build_array(
      jsonb_build_object('id', 'A', 'text', 'To ensure every request is retried immediately'),
      jsonb_build_object('id', 'B', 'text', 'To prevent requests from remaining pending forever'),
      jsonb_build_object('id', 'C', 'text', 'To remove the database from the service'),
      jsonb_build_object('id', 'D', 'text', 'To make retries happen more often during an outage')
    ),
    'B',
    'The proposal explicitly says the limit ensures requests do not stay pending indefinitely.'
  )
on conflict (id) do update set
  level = excluded.level,
  skill = excluded.skill,
  prompt = excluded.prompt,
  options = excluded.options,
  correct_option = excluded.correct_option,
  explanation = excluded.explanation;
