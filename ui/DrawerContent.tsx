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
    title: 'Basic Forms',
    href: '/playground/basic',
  },
  {
    title: 'Form Layouts',
    href: '/playground/layout',
  },
  {
    title: 'Loic Forms',
    href: '/playground/logic',
  },
  {
    title: 'Wizard Forms',
    href: '/playground/wizard',
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
