import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Link from 'next/link';

const links: Array<{
  title: string;
  href: string;
  icon?: React.ReactNode;
}> = [
  {
    title: 'RNG Form Playground',
    href: '/playground/basic',
  },
];

export default function DrawerContent() {
  return (
    <List>
      {links.map((link, index) => (
        <ListItem key={link.title + index} disablePadding>
          <ListItemButton component={Link} href={link.href}>
            {link.icon && <ListItemIcon>{link.icon}</ListItemIcon>}
            <ListItemText primary={link.title} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
}
