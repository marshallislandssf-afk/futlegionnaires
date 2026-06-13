// ─── Player ──────────────────────────────────────────────────────────────────

export interface Player {
  // Identity (from Supabase — our canonical record)
  id: string
  slug: string
  created_at: string
  updated_at: string

  // Basic info
  name: string
  date_of_birth: string        // ISO date string e.g. "1998-03-01"
  age: number
  position: Position
  gender: 'Male' | 'Female'

  // Club
  current_club: string
  current_club_country: string
  current_club_confederation: Confederation

  // Nationalities (up to 5)
  nationality_1: string        // Primary — the nation they primarily represent / are known as
  nationality_2?: string
  nationality_3?: string
  nationality_4?: string
  nationality_5?: string

  // Media
  profile_image_url?: string   // TheSportsDB thumb or uploaded image
  cutout_image_url?: string    // Transparent PNG cutout

  // Social / video
  instagram_url?: string
  facebook_url?: string
  youtube_url?: string
  video_urls?: string[]        // Additional highlight clips
  transfermarkt_url?: string
  transfermarkt_id?: string

  // TheSportsDB cross-reference
  sportsdb_id?: string
  sportsdb_team_id?: string

  // Bio
  description?: string
  birth_location?: string
  ethnicity?: string
  height_cm?: number
  weight_kg?: number

  // Platform flags
  is_verified: boolean         // Manually verified by FutLegionnaires editors
  is_self_submitted: boolean   // Player submitted their own profile
  is_active: boolean
  status: 'Active' | 'Retired' | 'Free Agent'
}

// ─── Enums ───────────────────────────────────────────────────────────────────

export type Position =
  | 'Goalkeeper'
  | 'Centre-Back'
  | 'Right-Back'
  | 'Left-Back'
  | 'Defensive Midfielder'
  | 'Central Midfielder'
  | 'Attacking Midfielder'
  | 'Right Winger'
  | 'Left Winger'
  | 'Second Striker'
  | 'Centre-Forward'

export type Confederation = 'UEFA' | 'CAF' | 'CONMEBOL' | 'CONCACAF' | 'AFC' | 'OFC'

// ─── TheSportsDB API types ────────────────────────────────────────────────────

export interface SportsDBPlayer {
  idPlayer: string
  idTeam: string
  idTeam2: string | null
  idTeamNational: string | null
  idTransferMkt: string | null
  strPlayer: string
  strPlayerAlternate: string | null
  strTeam: string
  strTeam2: string | null
  strSport: string
  strNationality: string
  dateBorn: string | null
  strNumber: string | null
  strBirthLocation: string | null
  strEthnicity: string | null
  strStatus: string | null
  strGender: string
  strPosition: string | null
  strHeight: string | null
  strWeight: string | null
  strDescriptionEN: string | null
  strFacebook: string | null
  strTwitter: string | null
  strInstagram: string | null
  strYoutube: string | null
  strThumb: string | null
  strCutout: string | null
  strRender: string | null
  strBanner: string | null
  strFanart1: string | null
  strFanart2: string | null
  strFanart3: string | null
  strFanart4: string | null
  strLastName: string | null
}

export interface SportsDBSearchResult {
  player: SportsDBPlayer[] | null
}

export interface SportsDBLookupResult {
  players: SportsDBPlayer[] | null
}

// ─── API request/response shapes ─────────────────────────────────────────────

export interface PlayerSearchParams {
  q?: string
  position?: Position | ''
  confederation?: Confederation | ''
  nationality?: string
  club?: string
  age_min?: number
  age_max?: number
  page?: number
  page_size?: number
}

export interface PlayerSearchResponse {
  players: Player[]
  total: number
  page: number
  page_size: number
}

export interface PlayerSubmission {
  name: string
  date_of_birth: string
  position: Position
  current_club: string
  current_club_country: string
  nationality_1: string
  nationality_2?: string
  nationality_3?: string
  nationality_4?: string
  nationality_5?: string
  instagram_url?: string
  video_urls?: string[]
  transfermarkt_url?: string
  description?: string
  submitter_email: string
}

// ─── Scout / Analytics ───────────────────────────────────────────────────────

export interface LeagueStat {
  league: string
  country: string
  confederation: Confederation
  player_count: number
}

export interface NationStat {
  nationality: string
  confederation: Confederation
  uncapped_count: number
  total_count: number
}

export interface ConfederationStat {
  confederation: Confederation
  player_count: number
  club_count: number
  country_count: number
}

export interface MapStats {
  confederations: ConfederationStat[]
  top_leagues: LeagueStat[]
  top_nations: NationStat[]
  total_players: number
  country_player_counts?: Record<string, number>  // per-country eligible player counts
}

// ─── Supabase DB row types ────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      players: {
        Row: Player
        Insert: Omit<Player, 'id' | 'created_at' | 'updated_at' | 'age'>
        Update: Partial<Omit<Player, 'id' | 'created_at'>>
      }
      player_submissions: {
        Row: PlayerSubmission & {
          id: string
          created_at: string
          status: 'pending' | 'approved' | 'rejected'
        }
        Insert: PlayerSubmission
        Update: Partial<PlayerSubmission>
      }
    }
  }
}
