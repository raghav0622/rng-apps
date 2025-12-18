import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links: Array<{
  title: string;
  href: string;
  icon?: React.ReactNode;
}> = [
  {
    title: 'Dashboard',
    href: '/dashboard',
  },
  {
    title: 'Profile',
    href: '/dashboard/profile',
  },
];

export default function DrawerContent() {
  const path = usePathname();
  return (
    <List>
      {links.map((link, index) => (
        <ListItem key={link.title + index} disablePadding>
          <ListItemButton component={Link} href={link.href} selected={path === link.href}>
            {link.icon && <ListItemIcon>{link.icon}</ListItemIcon>}
            <ListItemText primary={link.title} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}
