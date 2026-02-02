export type Movie = {
  id: string;
  title: string;          // Título original
  titleCo?: string | null; // (Opcional) título oficial en Colombia si difiere
};

export const MOVIES: Movie[] = [
  // Best Picture + core
  { id: "bugonia", title: "Bugonia", titleCo: null },
  { id: "f1", title: "F1", titleCo: null },
  { id: "frankenstein", title: "Frankenstein", titleCo: null },
  { id: "hamnet", title: "Hamnet", titleCo: null },
  { id: "marty_supreme", title: "Marty Supreme", titleCo: null },
  { id: "one_battle_after_another", title: "One Battle after Another", titleCo: null },
  { id: "the_secret_agent", title: "The Secret Agent", titleCo: null },
  { id: "sentimental_value", title: "Sentimental Value", titleCo: null },
  { id: "sinners", title: "Sinners", titleCo: null },
  { id: "train_dreams", title: "Train Dreams", titleCo: null },

  // Acting / Screenplay extras
  { id: "blue_moon", title: "Blue Moon", titleCo: null },
  { id: "if_i_had_legs_id_kick_you", title: "If I Had Legs I'd Kick You", titleCo: null },
  { id: "song_sung_blue", title: "Song Sung Blue", titleCo: null },
  { id: "weapons", title: "Weapons", titleCo: null },

  // Animated Feature
  { id: "arco", title: "Arco", titleCo: null },
  { id: "elio", title: "Elio", titleCo: null },
  { id: "kpop_demon_hunters", title: "KPop Demon Hunters", titleCo: null },
  { id: "little_amelie_or_the_character_of_rain", title: "Little Amélie or the Character of Rain", titleCo: null },
  { id: "zootopia_2", title: "Zootopia 2", titleCo: null },

  // Animated Short
  { id: "butterfly", title: "Butterfly", titleCo: null },
  { id: "forevergreen", title: "Forevergreen", titleCo: null },
  { id: "the_girl_who_cried_pearls", title: "The Girl Who Cried Pearls", titleCo: null },
  { id: "retirement_plan", title: "Retirement Plan", titleCo: null },
  { id: "the_three_sisters", title: "The Three Sisters", titleCo: null },

  // Documentary Feature
  { id: "the_alabama_solution", title: "The Alabama Solution", titleCo: null },
  { id: "come_see_me_in_the_good_light", title: "Come See Me in the Good Light", titleCo: null },
  { id: "cutting_through_rocks", title: "Cutting through Rocks", titleCo: null },
  { id: "mr_nobody_against_putin", title: "Mr. Nobody against Putin", titleCo: null },
  { id: "the_perfect_neighbor", title: "The Perfect Neighbor", titleCo: null },

  // Documentary Short
  { id: "all_the_empty_rooms", title: "All the Empty Rooms", titleCo: null },
  { id: "armed_only_with_a_camera_the_life_and_death_of_brent_renaud", title: "Armed Only with a Camera: The Life and Death of Brent Renaud", titleCo: null },
  { id: "children_no_more_were_and_are_gone", title: "Children No More: \"Were and Are Gone\"", titleCo: null },
  { id: "the_devil_is_busy", title: "The Devil Is Busy", titleCo: null },
  { id: "perfectly_a_strangeness", title: "Perfectly a Strangeness", titleCo: null },

  // International Feature (films)
  { id: "it_was_just_an_accident", title: "It Was Just an Accident", titleCo: null },
  { id: "sirat", title: "Sirāt", titleCo: null },
  { id: "the_voice_of_hind_rajab", title: "The Voice of Hind Rajab", titleCo: null },

  // Live Action Short
  { id: "butchers_stain", title: "Butcher's Stain", titleCo: null },
  { id: "a_friend_of_dorothy", title: "A Friend of Dorothy", titleCo: null },
  { id: "jane_austens_period_drama", title: "Jane Austen's Period Drama", titleCo: null },
  { id: "the_singers", title: "The Singers", titleCo: null },
  { id: "two_people_exchanging_saliva", title: "Two People Exchanging Saliva", titleCo: null },

  // Makeup / Hairstyling extras
  { id: "kokuho", title: "Kokuho", titleCo: null },
  { id: "the_smashing_machine", title: "The Smashing Machine", titleCo: null },
  { id: "the_ugly_stepsister", title: "The Ugly Stepsister", titleCo: null },

  // VFX extras
  { id: "avatar_fire_and_ash", title: "Avatar: Fire and Ash", titleCo: null },
  { id: "jurassic_world_rebirth", title: "Jurassic World Rebirth", titleCo: null },
  { id: "the_lost_bus", title: "The Lost Bus", titleCo: null },

  // Original Song (films)
  { id: "diane_warren_relentless", title: "Diane Warren: Relentless", titleCo: null },
  { id: "viva_verdi", title: "Viva Verdi!", titleCo: null },
];
