/**
 * GTA 5 Missions and Tasks Registry & Engine
 */

export const GTA_MISSIONS = [
  {
    id: 'repo_job',
    title: 'The Repo Job',
    contact: 'Simeon Yetarian',
    subtitle: 'Luxury Auto Repossession',
    avatar: '🚗',
    dialogue: 'My friend! An ungrateful customer has defaulted on payments in the East District. Go retrieve the vehicle and bring it to my showroom before the time runs out!',
    cashReward: 20000,
    rpReward: 1500,
    timeLimit: 90, // seconds
    wantedOnStart: 0,
    steps: [
      {
        instruction: 'Drive to the impounded vehicle in the East District',
        targetPos: [23.0, 0, -10.0],
        radius: 4.5,
        type: 'pickup',
        markerColor: '#eab308', // Yellow beacon
      },
      {
        instruction: "Deliver the vehicle to Simeon's Dealership",
        targetPos: [6.0, 0, 22.0],
        radius: 5.0,
        type: 'delivery',
        markerColor: '#22c55e', // Green safehouse beacon
      },
    ],
  },
  {
    id: 'getaway',
    title: 'The Getaway',
    contact: 'Lester Crest',
    subtitle: 'High Heat Evasion',
    avatar: '🕶️',
    dialogue: 'Union Depository alarm just triggered! LSPD cruisers are swarming the perimeter. Break line of sight, shake the cops, and stash the car in the South Safehouse!',
    cashReward: 50000,
    rpReward: 3000,
    timeLimit: 120, // seconds
    wantedOnStart: 3, // 3 Stars!
    steps: [
      {
        instruction: 'Lose the Cops and survive the pursuit evasion',
        type: 'evade_cops',
        markerColor: '#ef4444',
      },
      {
        instruction: 'Deliver the getaway vehicle to the South Safehouse',
        targetPos: [6.0, 0, -68.0],
        radius: 5.5,
        type: 'safehouse',
        markerColor: '#00f2fe',
      },
    ],
  },
  {
    id: 'street_race',
    title: 'Downtown Apex GP',
    contact: 'Hao',
    subtitle: 'Underground Street Race',
    avatar: '🏁',
    dialogue: 'Yo! The Los Santos midnight sprint is on. 6 checkpoints through Grand Ave, West Alley, and the South Sector. Beat the clock to take 1st place!',
    cashReward: 25000,
    rpReward: 2000,
    timeLimit: 55, // seconds
    wantedOnStart: 1, // 1 Star street racing
    steps: [
      { instruction: 'Hit Checkpoint 1/6 (Grand Ave North)', targetPos: [6.0, 0, -10.0], radius: 6.0, type: 'race', markerColor: '#eab308' },
      { instruction: 'Hit Checkpoint 2/6 (North Plaza Turn)', targetPos: [6.0, 0, 20.0], radius: 6.0, type: 'race', markerColor: '#eab308' },
      { instruction: 'Hit Checkpoint 3/6 (West Avenue Cross)', targetPos: [-10.5, 0, 18.0], radius: 6.0, type: 'race', markerColor: '#eab308' },
      { instruction: 'Hit Checkpoint 4/6 (West Boulevard)', targetPos: [-10.5, 0, -22.0], radius: 6.0, type: 'race', markerColor: '#eab308' },
      { instruction: 'Hit Checkpoint 5/6 (Southwest Alley)', targetPos: [-10.5, 0, -55.0], radius: 6.0, type: 'race', markerColor: '#eab308' },
      { instruction: 'Cross Finish Line (Grand Avenue South)', targetPos: [6.0, 0, -45.0], radius: 6.0, type: 'race', markerColor: '#22c55e' },
    ],
  },
  {
    id: 'stunt_runner',
    title: 'Stunt Runner',
    contact: 'Trevor Philips',
    subtitle: 'Maximum Adrenaline Jump',
    avatar: '💥',
    dialogue: 'Trevor Philips Enterprises demands SPEED! Punch that throttle past 160 KM/H through the speed radar and land clean on the southern plaza!',
    cashReward: 35000,
    rpReward: 2200,
    timeLimit: 80,
    wantedOnStart: 1,
    steps: [
      {
        instruction: 'Clock over 160 KM/H at Grand Ave Radar Trap',
        type: 'speed_check',
        minSpeed: 160,
        targetPos: [6.0, 0, 32.0],
        radius: 8.0,
        markerColor: '#f97316',
      },
      {
        instruction: 'Stunt Jump to Trevor Safe Landing Zone',
        targetPos: [6.0, 0, -82.0],
        radius: 6.5,
        type: 'stunt_land',
        markerColor: '#eab308',
      },
    ],
  },
];

// Hidden GTA Cash Briefcases scattered across secret city spots ($5,000 each)
export const GTA_CASH_PICKUPS = [
  { id: 'cash_1', pos: [23.5, 0.4, -18.0], amount: 5000, collected: false },
  { id: 'cash_2', pos: [-11.5, 0.4, -38.0], amount: 5000, collected: false },
  { id: 'cash_3', pos: [18.0, 0.4, 22.0], amount: 5000, collected: false },
  { id: 'cash_4', pos: [-11.0, 0.4, 12.0], amount: 5000, collected: false },
  { id: 'cash_5', pos: [32.0, 0.4, -15.0], amount: 5000, collected: false },
  { id: 'cash_6', pos: [6.0, 0.4, -72.0], amount: 5000, collected: false },
];

export const GTA_RADIO_STATIONS = [
  { id: 0, name: 'Radio Off', genre: 'Mute', color: '#64748b' },
  { id: 1, name: 'Radio Los Santos', genre: 'West Coast Hip Hop', color: '#f59e0b' },
  { id: 2, name: 'Non-Stop Pop FM', genre: 'Pop & Synthwave', color: '#ec4899' },
  { id: 3, name: 'Soulwax FM', genre: 'Electro & Techno', color: '#06b6d4' },
];
