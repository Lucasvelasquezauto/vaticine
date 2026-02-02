export type Nominee = {
  id: string;
  title: string;
  subtitle?: string;
  movieId: string; // a qué película/obra se le cuelga poster/imdb/trailer/rotten
};

export type Category = {
  id: string;
  name: string;
  nominees: Nominee[];
};

export const CATEGORIES: Category[] = [
  {
    id: "best_picture",
    name: "Mejor Película",
    nominees: [
      { id: "bp_bugonia", title: "Bugonia", subtitle: "Productores", movieId: "bugonia" },
      { id: "bp_f1", title: "F1", subtitle: "Productores", movieId: "f1" },
      { id: "bp_frankenstein", title: "Frankenstein", subtitle: "Productores", movieId: "frankenstein" },
      { id: "bp_hamnet", title: "Hamnet", subtitle: "Productores", movieId: "hamnet" },
      { id: "bp_marty_supreme", title: "Marty Supreme", subtitle: "Productores", movieId: "marty_supreme" },
      { id: "bp_one_battle_after_another", title: "One Battle after Another", subtitle: "Productores", movieId: "one_battle_after_another" },
      { id: "bp_the_secret_agent", title: "The Secret Agent", subtitle: "Productores", movieId: "the_secret_agent" },
      { id: "bp_sentimental_value", title: "Sentimental Value", subtitle: "Productores", movieId: "sentimental_value" },
      { id: "bp_sinners", title: "Sinners", subtitle: "Productores", movieId: "sinners" },
      { id: "bp_train_dreams", title: "Train Dreams", subtitle: "Productores", movieId: "train_dreams" },
    ],
  },

  {
    id: "directing",
    name: "Mejor Dirección",
    nominees: [
      { id: "dir_hamnet", title: "Hamnet", subtitle: "Chloé Zhao", movieId: "hamnet" },
      { id: "dir_marty_supreme", title: "Marty Supreme", subtitle: "Josh Safdie", movieId: "marty_supreme" },
      { id: "dir_one_battle_after_another", title: "One Battle after Another", subtitle: "Paul Thomas Anderson", movieId: "one_battle_after_another" },
      { id: "dir_sentimental_value", title: "Sentimental Value", subtitle: "Joachim Trier", movieId: "sentimental_value" },
      { id: "dir_sinners", title: "Sinners", subtitle: "Ryan Coogler", movieId: "sinners" },
    ],
  },

  {
    id: "actor_leading",
    name: "Mejor Actor Protagónico",
    nominees: [
      { id: "al_chalamet", title: "Timothée Chalamet", subtitle: "Marty Supreme", movieId: "marty_supreme" },
      { id: "al_dicaprio", title: "Leonardo DiCaprio", subtitle: "One Battle after Another", movieId: "one_battle_after_another" },
      { id: "al_hawke", title: "Ethan Hawke", subtitle: "Blue Moon", movieId: "blue_moon" },
      { id: "al_jordan", title: "Michael B. Jordan", subtitle: "Sinners", movieId: "sinners" },
      { id: "al_moura", title: "Wagner Moura", subtitle: "The Secret Agent", movieId: "the_secret_agent" },
    ],
  },

  {
    id: "actress_leading",
    name: "Mejor Actriz Protagónica",
    nominees: [
      { id: "al_buckley", title: "Jessie Buckley", subtitle: "Hamnet", movieId: "hamnet" },
      { id: "al_byrne", title: "Rose Byrne", subtitle: "If I Had Legs I'd Kick You", movieId: "if_i_had_legs_id_kick_you" },
      { id: "al_hudson", title: "Kate Hudson", subtitle: "Song Sung Blue", movieId: "song_sung_blue" },
      { id: "al_reinsve", title: "Renate Reinsve", subtitle: "Sentimental Value", movieId: "sentimental_value" },
      { id: "al_stone", title: "Emma Stone", subtitle: "Bugonia", movieId: "bugonia" },
    ],
  },

  {
    id: "actor_supporting",
    name: "Mejor Actor de Reparto",
    nominees: [
      { id: "as_del_toro", title: "Benicio Del Toro", subtitle: "One Battle after Another", movieId: "one_battle_after_another" },
      { id: "as_elordi", title: "Jacob Elordi", subtitle: "Frankenstein", movieId: "frankenstein" },
      { id: "as_lindo", title: "Delroy Lindo", subtitle: "Sinners", movieId: "sinners" },
      { id: "as_penn", title: "Sean Penn", subtitle: "One Battle after Another", movieId: "one_battle_after_another" },
      { id: "as_skarsgard", title: "Stellan Skarsgård", subtitle: "Sentimental Value", movieId: "sentimental_value" },
    ],
  },

  {
    id: "actress_supporting",
    name: "Mejor Actriz de Reparto",
    nominees: [
      { id: "as_fanning", title: "Elle Fanning", subtitle: "Sentimental Value", movieId: "sentimental_value" },
      { id: "as_lilleaas", title: "Inga Ibsdotter Lilleaas", subtitle: "Sentimental Value", movieId: "sentimental_value" },
      { id: "as_madigan", title: "Amy Madigan", subtitle: "Weapons", movieId: "weapons" },
      { id: "as_mosaku", title: "Wunmi Mosaku", subtitle: "Sinners", movieId: "sinners" },
      { id: "as_taylor", title: "Teyana Taylor", subtitle: "One Battle after Another", movieId: "one_battle_after_another" },
    ],
  },

  {
    id: "screenplay_original",
    name: "Mejor Guion Original",
    nominees: [
      { id: "wo_blue_moon", title: "Blue Moon", subtitle: "Robert Kaplow", movieId: "blue_moon" },
      { id: "wo_it_was_just_an_accident", title: "It Was Just an Accident", subtitle: "Jafar Panahi (+ colaboradores)", movieId: "it_was_just_an_accident" },
      { id: "wo_marty_supreme", title: "Marty Supreme", subtitle: "Ronald Bronstein & Josh Safdie", movieId: "marty_supreme" },
      { id: "wo_sentimental_value", title: "Sentimental Value", subtitle: "Eskil Vogt, Joachim Trier", movieId: "sentimental_value" },
      { id: "wo_sinners", title: "Sinners", subtitle: "Ryan Coogler", movieId: "sinners" },
    ],
  },

  {
    id: "screenplay_adapted",
    name: "Mejor Guion Adaptado",
    nominees: [
      { id: "wa_bugonia", title: "Bugonia", subtitle: "Will Tracy", movieId: "bugonia" },
      { id: "wa_frankenstein", title: "Frankenstein", subtitle: "Guillermo del Toro", movieId: "frankenstein" },
      { id: "wa_hamnet", title: "Hamnet", subtitle: "Chloé Zhao & Maggie O'Farrell", movieId: "hamnet" },
      { id: "wa_one_battle_after_another", title: "One Battle after Another", subtitle: "Paul Thomas Anderson", movieId: "one_battle_after_another" },
      { id: "wa_train_dreams", title: "Train Dreams", subtitle: "Clint Bentley & Greg Kwedar", movieId: "train_dreams" },
    ],
  },

  {
    id: "animated_feature",
    name: "Mejor Película Animada",
    nominees: [
      { id: "af_arco", title: "Arco", subtitle: "Equipo principal", movieId: "arco" },
      { id: "af_elio", title: "Elio", subtitle: "Equipo principal", movieId: "elio" },
      { id: "af_kpop", title: "KPop Demon Hunters", subtitle: "Equipo principal", movieId: "kpop_demon_hunters" },
      { id: "af_little_amelie", title: "Little Amélie or the Character of Rain", subtitle: "Equipo principal", movieId: "little_amelie_or_the_character_of_rain" },
      { id: "af_zootopia2", title: "Zootopia 2", subtitle: "Equipo principal", movieId: "zootopia_2" },
    ],
  },

  {
    id: "animated_short",
    name: "Mejor Corto Animado",
    nominees: [
      { id: "as_butterfly", title: "Butterfly", subtitle: "Florence Miailhe; Ron Dyens", movieId: "butterfly" },
      { id: "as_forevergreen", title: "Forevergreen", subtitle: "Nathan Engelhardt; Jeremy Spears", movieId: "forevergreen" },
      { id: "as_girl_pearls", title: "The Girl Who Cried Pearls", subtitle: "Chris Lavis; Maciek Szczerbowski", movieId: "the_girl_who_cried_pearls" },
      { id: "as_retirement_plan", title: "Retirement Plan", subtitle: "John Kelly; Andrew Freedman", movieId: "retirement_plan" },
      { id: "as_three_sisters", title: "The Three Sisters", subtitle: "Konstantin Bronzit", movieId: "the_three_sisters" },
    ],
  },

  {
    id: "casting",
    name: "Mejor Casting",
    nominees: [
      { id: "cast_hamnet", title: "Hamnet", subtitle: "Nina Gold", movieId: "hamnet" },
      { id: "cast_marty_supreme", title: "Marty Supreme", subtitle: "Jennifer Venditti", movieId: "marty_supreme" },
      { id: "cast_one_battle", title: "One Battle after Another", subtitle: "Cassandra Kulukundis", movieId: "one_battle_after_another" },
      { id: "cast_secret_agent", title: "The Secret Agent", subtitle: "Gabriel Domingues", movieId: "the_secret_agent" },
      { id: "cast_sinners", title: "Sinners", subtitle: "Francine Maisler", movieId: "sinners" },
    ],
  },

  {
    id: "cinematography",
    name: "Mejor Fotografía",
    nominees: [
      { id: "cin_frankenstein", title: "Frankenstein", subtitle: "Dan Laustsen", movieId: "frankenstein" },
      { id: "cin_marty_supreme", title: "Marty Supreme", subtitle: "Darius Khondji", movieId: "marty_supreme" },
      { id: "cin_one_battle", title: "One Battle after Another", subtitle: "Michael Bauman", movieId: "one_battle_after_another" },
      { id: "cin_sinners", title: "Sinners", subtitle: "Autumn Durald Arkapaw", movieId: "sinners" },
      { id: "cin_train_dreams", title: "Train Dreams", subtitle: "Adolpho Veloso", movieId: "train_dreams" },
    ],
  },

  {
    id: "costume_design",
    name: "Mejor Vestuario",
    nominees: [
      { id: "cost_avatar", title: "Avatar: Fire and Ash", subtitle: "Deborah L. Scott", movieId: "avatar_fire_and_ash" },
      { id: "cost_frankenstein", title: "Frankenstein", subtitle: "Kate Hawley", movieId: "frankenstein" },
      { id: "cost_hamnet", title: "Hamnet", subtitle: "Malgosia Turzanska", movieId: "hamnet" },
      { id: "cost_marty_supreme", title: "Marty Supreme", subtitle: "Miyako Bellizzi", movieId: "marty_supreme" },
      { id: "cost_sinners", title: "Sinners", subtitle: "Ruth E. Carter", movieId: "sinners" },
    ],
  },

  {
    id: "film_editing",
    name: "Mejor Montaje",
    nominees: [
      { id: "edit_f1", title: "F1", subtitle: "Stephen Mirrione", movieId: "f1" },
      { id: "edit_marty_supreme", title: "Marty Supreme", subtitle: "Ronald Bronstein & Josh Safdie", movieId: "marty_supreme" },
      { id: "edit_one_battle", title: "One Battle after Another", subtitle: "Andy Jurgensen", movieId: "one_battle_after_another" },
      { id: "edit_sentimental_value", title: "Sentimental Value", subtitle: "Olivier Bugge Coutté", movieId: "sentimental_value" },
      { id: "edit_sinners", title: "Sinners", subtitle: "Michael P. Shawver", movieId: "sinners" },
    ],
  },

  {
    id: "international_feature",
    name: "Mejor Película Internacional",
    nominees: [
      { id: "int_secret_agent", title: "The Secret Agent", subtitle: "Brasil", movieId: "the_secret_agent" },
      { id: "int_accident", title: "It Was Just an Accident", subtitle: "Francia", movieId: "it_was_just_an_accident" },
      { id: "int_sentimental", title: "Sentimental Value", subtitle: "Noruega", movieId: "sentimental_value" },
      { id: "int_sirat", title: "Sirāt", subtitle: "España", movieId: "sirat" },
      { id: "int_voice", title: "The Voice of Hind Rajab", subtitle: "Túnez", movieId: "the_voice_of_hind_rajab" },
    ],
  },

  {
    id: "documentary_feature",
    name: "Mejor Documental",
    nominees: [
      { id: "docf_alabama", title: "The Alabama Solution", subtitle: "Andrew Jarecki; Charlotte Kaufman", movieId: "the_alabama_solution" },
      { id: "docf_good_light", title: "Come See Me in the Good Light", subtitle: "Ryan White (+ equipo)", movieId: "come_see_me_in_the_good_light" },
      { id: "docf_rocks", title: "Cutting through Rocks", subtitle: "Sara Khaki; Mohammadreza Eyni", movieId: "cutting_through_rocks" },
      { id: "docf_putin", title: "Mr. Nobody against Putin", subtitle: "Nominados por determinar", movieId: "mr_nobody_against_putin" },
      { id: "docf_neighbor", title: "The Perfect Neighbor", subtitle: "Geeta Gandbhir (+ equipo)", movieId: "the_perfect_neighbor" },
    ],
  },

  {
    id: "documentary_short",
    name: "Mejor Corto Documental",
    nominees: [
      { id: "docs_empty_rooms", title: "All the Empty Rooms", subtitle: "Joshua Seftel; Conall Jones", movieId: "all_the_empty_rooms" },
      { id: "docs_brent", title: "Armed Only with a Camera: The Life and Death of Brent Renaud", subtitle: "Craig Renaud; Juan Arredondo", movieId: "armed_only_with_a_camera_the_life_and_death_of_brent_renaud" },
      { id: "docs_children", title: "Children No More: \"Were and Are Gone\"", subtitle: "Hilla Medalia; Sheila Nevins", movieId: "children_no_more_were_and_are_gone" },
      { id: "docs_devil", title: "The Devil Is Busy", subtitle: "Christalyn Hampton; Geeta Gandbhir", movieId: "the_devil_is_busy" },
      { id: "docs_strangeness", title: "Perfectly a Strangeness", subtitle: "Alison McAlpine", movieId: "perfectly_a_strangeness" },
    ],
  },

  {
    id: "live_action_short",
    name: "Mejor Cortometraje",
    nominees: [
      { id: "las_butchers", title: "Butcher's Stain", subtitle: "Meyer Levinson-Blount; Oron Caspi", movieId: "butchers_stain" },
      { id: "las_dorothy", title: "A Friend of Dorothy", subtitle: "Lee Knight; James Dean", movieId: "a_friend_of_dorothy" },
      { id: "las_austen", title: "Jane Austen's Period Drama", subtitle: "Julia Aks; Steve Pinder", movieId: "jane_austens_period_drama" },
      { id: "las_singers", title: "The Singers", subtitle: "Sam A. Davis; Jack Piatt", movieId: "the_singers" },
      { id: "las_saliva", title: "Two People Exchanging Saliva", subtitle: "Alexandre Singh; Natalie Musteata", movieId: "two_people_exchanging_saliva" },
    ],
  },

  {
    id: "makeup_hairstyling",
    name: "Mejor Maquillaje y Peinado",
    nominees: [
      { id: "mua_frankenstein", title: "Frankenstein", subtitle: "Mike Hill (+ equipo)", movieId: "frankenstein" },
      { id: "mua_kokuho", title: "Kokuho", subtitle: "Kyoko Toyokawa (+ equipo)", movieId: "kokuho" },
      { id: "mua_sinners", title: "Sinners", subtitle: "Ken Diaz (+ equipo)", movieId: "sinners" },
      { id: "mua_smashing", title: "The Smashing Machine", subtitle: "Kazu Hiro (+ equipo)", movieId: "the_smashing_machine" },
      { id: "mua_ugly", title: "The Ugly Stepsister", subtitle: "Thomas Foldberg (+ equipo)", movieId: "the_ugly_stepsister" },
    ],
  },

  {
    id: "score_original",
    name: "Mejor Música (Score)",
    nominees: [
      { id: "score_bugonia", title: "Bugonia", subtitle: "Jerskin Fendrix", movieId: "bugonia" },
      { id: "score_frankenstein", title: "Frankenstein", subtitle: "Alexandre Desplat", movieId: "frankenstein" },
      { id: "score_hamnet", title: "Hamnet", subtitle: "Max Richter", movieId: "hamnet" },
      { id: "score_one_battle", title: "One Battle after Another", subtitle: "Jonny Greenwood", movieId: "one_battle_after_another" },
      { id: "score_sinners", title: "Sinners", subtitle: "Ludwig Göransson", movieId: "sinners" },
    ],
  },

  {
    id: "song_original",
    name: "Mejor Canción Original",
    nominees: [
      { id: "song_dear_me", title: "Dear Me", subtitle: "de Diane Warren: Relentless", movieId: "diane_warren_relentless" },
      { id: "song_golden", title: "Golden", subtitle: "de KPop Demon Hunters", movieId: "kpop_demon_hunters" },
      { id: "song_i_lied_to_you", title: "I Lied To You", subtitle: "de Sinners", movieId: "sinners" },
      { id: "song_sweet_dreams", title: "Sweet Dreams Of Joy", subtitle: "de Viva Verdi!", movieId: "viva_verdi" },
      { id: "song_train_dreams", title: "Train Dreams", subtitle: "de Train Dreams", movieId: "train_dreams" },
    ],
  },

  {
    id: "production_design",
    name: "Mejor Diseño de Producción",
    nominees: [
      { id: "pd_frankenstein", title: "Frankenstein", subtitle: "Tamara Deverell; Shane Vieau", movieId: "frankenstein" },
      { id: "pd_hamnet", title: "Hamnet", subtitle: "Fiona Crombie; Alice Felton", movieId: "hamnet" },
      { id: "pd_marty_supreme", title: "Marty Supreme", subtitle: "Jack Fisk; Adam Willis", movieId: "marty_supreme" },
      { id: "pd_one_battle", title: "One Battle after Another", subtitle: "Florencia Martin; Anthony Carlino", movieId: "one_battle_after_another" },
      { id: "pd_sinners", title: "Sinners", subtitle: "Hannah Beachler; Monique Champagne", movieId: "sinners" },
    ],
  },

  {
    id: "sound",
    name: "Mejor Sonido",
    nominees: [
      { id: "snd_f1", title: "F1", subtitle: "Gareth John (+ equipo)", movieId: "f1" },
      { id: "snd_frankenstein", title: "Frankenstein", subtitle: "Greg Chapman (+ equipo)", movieId: "frankenstein" },
      { id: "snd_one_battle", title: "One Battle after Another", subtitle: "José Antonio García (+ equipo)", movieId: "one_battle_after_another" },
      { id: "snd_sinners", title: "Sinners", subtitle: "Chris Welcker (+ equipo)", movieId: "sinners" },
      { id: "snd_sirat", title: "Sirāt", subtitle: "Amanda Villavieja (+ equipo)", movieId: "sirat" },
    ],
  },

  {
    id: "visual_effects",
    name: "Mejores Efectos Visuales",
    nominees: [
      { id: "vfx_avatar", title: "Avatar: Fire and Ash", subtitle: "Joe Letteri (+ equipo)", movieId: "avatar_fire_and_ash" },
      { id: "vfx_f1", title: "F1", subtitle: "Ryan Tudhope (+ equipo)", movieId: "f1" },
      { id: "vfx_jurassic", title: "Jurassic World Rebirth", subtitle: "David Vickery (+ equipo)", movieId: "jurassic_world_rebirth" },
      { id: "vfx_lost_bus", title: "The Lost Bus", subtitle: "Charlie Noble (+ equipo)", movieId: "the_lost_bus" },
      { id: "vfx_sinners", title: "Sinners", subtitle: "Michael Ralla (+ equipo)", movieId: "sinners" },
    ],
  },
];
