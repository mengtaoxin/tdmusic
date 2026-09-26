import type { SvgIconComponent } from '@mui/icons-material';
import AlbumIcon from '@mui/icons-material/Album';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import NotesOutlinedIcon from '@mui/icons-material/NotesOutlined';
import PersonIcon from '@mui/icons-material/Person';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import TranslateIcon from '@mui/icons-material/Translate';

import type { AppLocale } from '@/lib/locale';

export const GITHUB_ISSUES_URL = 'https://github.com/mengtaoxin/tdmusic/issues';

export type NavRouteLink = { to: string; key: string; Icon: SvgIconComponent };
export type NavActionLink = { action: 'feedback'; key: string; Icon: SvgIconComponent };
export type NavLocaleLink = { locale: AppLocale; key: string; Icon: SvgIconComponent };
export type NavLink = NavRouteLink | NavActionLink | NavLocaleLink;
export type NavGroup = {
  key: string;
  Icon: SvgIconComponent;
  children: readonly NavLink[];
  menuTestId: string;
};
export type NavItem = NavRouteLink | NavGroup;

export function isNavGroup(item: NavItem): item is NavGroup {
  return 'children' in item;
}

export function isActionNavLink(item: NavLink): item is NavActionLink {
  return 'action' in item;
}

export function isLocaleNavLink(item: NavLink): item is NavLocaleLink {
  return 'locale' in item;
}

const moreChildren: readonly NavLink[] = [
  { to: '/search', key: 'nav.search', Icon: SearchIcon },
  { to: '/stats', key: 'nav.stats', Icon: BarChartOutlinedIcon },
  { to: '/settings', key: 'nav.settings', Icon: SettingsIcon },
  { to: '/config-guides', key: 'nav.configGuides', Icon: DescriptionOutlinedIcon },
  { to: '/about', key: 'nav.about', Icon: InfoOutlinedIcon },
  { to: '/logs', key: 'nav.logs', Icon: NotesOutlinedIcon },
  { action: 'feedback', key: 'nav.feedback', Icon: FeedbackOutlinedIcon },
];

const localeChildren: readonly NavLocaleLink[] = [
  { locale: 'en', key: 'locale.en', Icon: TranslateIcon },
  { locale: 'zh', key: 'locale.zh', Icon: TranslateIcon },
];

export const navItems: readonly NavItem[] = [
  { to: '/now-playing', key: 'nav.nowPlaying', Icon: PlayCircleIcon },
  { to: '/music', key: 'nav.musicList', Icon: LibraryMusicIcon },
  { to: '/playlists', key: 'nav.playlist', Icon: QueueMusicIcon },
  { to: '/artists', key: 'nav.artistList', Icon: PersonIcon },
  { to: '/albums', key: 'nav.albumList', Icon: AlbumIcon },
  {
    key: 'nav.language',
    Icon: TranslateIcon,
    children: localeChildren,
    menuTestId: 'nav-locale',
  },
  { key: 'nav.more', Icon: MoreHorizIcon, children: moreChildren, menuTestId: 'nav-more' },
];

export const moreChildPaths: readonly string[] = moreChildren.flatMap((item) =>
  isActionNavLink(item) || isLocaleNavLink(item) ? [] : [item.to],
);
