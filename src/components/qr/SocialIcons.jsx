// Social media SVG icon components using uploaded brand assets
// Each icon preserves its original brand colors

export const FacebookIcon = ({ className }) => (
  <img src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/56a7fe364_facebook.svg" alt="Facebook" className={className} />
);

export const GithubIcon = ({ className }) => (
  <img src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/c5fe28c90_github.svg" alt="GitHub" className={className} />
);

export const InstagramIcon = ({ className }) => (
  <img src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/e73bd0887_instagram.svg" alt="Instagram" className={className} />
);

export const LinkedInIcon = ({ className }) => (
  <img src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/597dc8d4a_linkedin.svg" alt="LinkedIn" className={className} />
);

export const MediumIcon = ({ className }) => (
  <img src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/8fdd2a5af_medium.svg" alt="Medium" className={className} />
);

export const PatreonIcon = ({ className }) => (
  <img src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/c17d0d873_patreon.svg" alt="Patreon" className={className} />
);

export const PinterestIcon = ({ className }) => (
  <img src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/9c655d69a_pinterest.svg" alt="Pinterest" className={className} />
);

export const RedditIcon = ({ className }) => (
  <img src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/e90823e0b_reddit.svg" alt="Reddit" className={className} />
);

export const RssIcon = ({ className }) => (
  <img src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/d7156a6e1_rss.svg" alt="RSS" className={className} />
);

export const SnapchatIcon = ({ className }) => (
  <img src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/3034f789c_snapchat.svg" alt="Snapchat" className={className} />
);

export const TelegramIcon = ({ className }) => (
  <img src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/e270df478_telegram.svg" alt="Telegram" className={className} />
);

export const ThreadsIcon = ({ className }) => (
  <img src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/d43cdb621_threads.svg" alt="Threads" className={className} />
);

export const TikTokIcon = ({ className }) => (
  <img src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/757e01402_tik-tok.svg" alt="TikTok" className={className} />
);

export const WhatsAppIcon = ({ className }) => (
  <img src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/e8e730375_whatsapp.svg" alt="WhatsApp" className={className} />
);

export const XTwitterIcon = ({ className }) => (
  <img src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/7834d6cc7_x-twitter.svg" alt="X / Twitter" className={className} />
);

export const YelpIcon = ({ className }) => (
  <img src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/7e92d20c2_yelp.svg" alt="Yelp" className={className} />
);

export const YoutubeIcon = ({ className }) => (
  <img src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/556927dc8_youtube.svg" alt="YouTube" className={className} />
);

export const DiscordIcon = ({ className }) => (
  <img src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/e1d0d0439_discord.svg" alt="Discord" className={className} />
);

export const SoundCloudIcon = ({ className }) => (
  <img src="https://media.base44.com/images/public/697bd26bb993b44c81affe97/cbb3bbd07_soundcloud.svg" alt="SoundCloud" className={className} />
);

// Registry: maps platform keys → branded SVG icon component
export const SOCIAL_ICON_REGISTRY = {
  facebook:   FacebookIcon,
  github:     GithubIcon,
  instagram:  InstagramIcon,
  linkedin:   LinkedInIcon,
  medium:     MediumIcon,
  patreon:    PatreonIcon,
  pinterest:  PinterestIcon,
  reddit:     RedditIcon,
  rss:        RssIcon,
  snapchat:   SnapchatIcon,
  telegram:   TelegramIcon,
  threads:    ThreadsIcon,
  tiktok:     TikTokIcon,
  whatsapp:   WhatsAppIcon,
  x:          XTwitterIcon,
  twitter:    XTwitterIcon,
  yelp:       YelpIcon,
  youtube:    YoutubeIcon,
  discord:    DiscordIcon,
  soundcloud: SoundCloudIcon,
};

// Ordered list used in the platform dropdown in forms
export const SOCIAL_PLATFORMS = [
  { key: 'facebook',  label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'x',        label: 'X / Twitter' },
  { key: 'linkedin',  label: 'LinkedIn' },
  { key: 'youtube',   label: 'YouTube' },
  { key: 'tiktok',    label: 'TikTok' },
  { key: 'whatsapp',  label: 'WhatsApp' },
  { key: 'telegram',  label: 'Telegram' },
  { key: 'threads',   label: 'Threads' },
  { key: 'snapchat',  label: 'Snapchat' },
  { key: 'pinterest', label: 'Pinterest' },
  { key: 'reddit',    label: 'Reddit' },
  { key: 'github',    label: 'GitHub' },
  { key: 'medium',    label: 'Medium' },
  { key: 'patreon',   label: 'Patreon' },
  { key: 'yelp',      label: 'Yelp' },
  { key: 'rss',       label: 'RSS' },
  { key: 'discord',   label: 'Discord' },
  { key: 'soundcloud', label: 'SoundCloud' },
];

export function getSocialIcon(platform) {
  const key = (platform || '').toLowerCase().trim();
  return SOCIAL_ICON_REGISTRY[key] || null;
}