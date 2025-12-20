// 'use client';

// import { Badge, Button, Card, Group, Loader, Stack, Text } from '@mantine/core'; // Assuming Mantine based on your UI files, adjust if using Shadcn/others
// import { notifications } from '@mantine/notifications';
// import { IconDeviceDesktop, IconDeviceMobile, IconTrash } from '@tabler/icons-react'; // Or your icon library
// import { useAction } from 'next-safe-action/hooks';
// import { useEffect, useState } from 'react';
// import { getSessionsAction, revokeAllSessionsAction, revokeSessionAction } from '../auth.actions';
// import { Session } from '../auth.model';

// // Helper to check if this row is the current session
// // We can pass the current session ID via props or check a cookie in client (less reliable)
// // For now, we will highlight based on the "Created Recently" or just list them.
// // ideally, you pass { currentSessionId } from the server page to this component.

// export function ActiveSessions({ currentSessionId }: { currentSessionId?: string }) {
//   const [sessions, setSessions] = useState<Session[]>([]);

//   // 1. Fetch Sessions
//   const { execute: fetchSessions, isExecuting: isLoading } = useAction(getSessionsAction, {
//     onSuccess: (result) => {
//       if (result.data?.success) {
//         setSessions(result.data.data);
//       }
//     },
//   });

//   // 2. Revoke Single Session
//   const { execute: revokeSession, isExecuting: isRevoking } = useAction(revokeSessionAction, {
//     onSuccess: (result) => {
//       if (result.data?.success) {
//         notifications.show({ title: 'Success', message: 'Session revoked', color: 'green' });
//         fetchSessions(); // Refresh list
//       }
//     },
//   });

//   // 3. Revoke All (Sign out all other devices)
//   const { execute: revokeAll, isExecuting: isRevokingAll } = useAction(revokeAllSessionsAction, {
//     onSuccess: (result) => {
//       if (result.data?.success) {
//         notifications.show({
//           title: 'Success',
//           message: 'All other sessions revoked',
//           color: 'green',
//         });
//         // Ideally, this redirects the USER to login if they killed their OWN session.
//         // But usually "Revoke All" keeps the *current* one alive or kills everything.
//         // Our backend logic kills everything, so we should redirect.
//         window.location.href = '/login';
//       }
//     },
//   });

//   useEffect(() => {
//     fetchSessions();
//   }, []);

//   const getDeviceIcon = (ua: string) => {
//     if (ua.toLowerCase().includes('mobile')) return <IconDeviceMobile />;
//     return <IconDeviceDesktop />;
//   };

//   const getDeviceName = (ua: string) => {
//     if (ua.includes('Macintosh')) return 'Mac OS';
//     if (ua.includes('Windows')) return 'Windows';
//     if (ua.includes('iPhone')) return 'iPhone';
//     if (ua.includes('Android')) return 'Android';
//     return 'Unknown Device';
//   };

//   return (
//     <Card withBorder padding="lg" radius="md">
//       <Group justify="space-between" mb="md">
//         <Text fw={600} size="lg">
//           Active Sessions
//         </Text>
//         <Button
//           color="red"
//           variant="light"
//           size="xs"
//           loading={isRevokingAll}
//           onClick={() => {
//             if (confirm('Are you sure? This will log you out of all devices.')) {
//               revokeAll();
//             }
//           }}
//         >
//           Log out everywhere
//         </Button>
//       </Group>

//       {isLoading ? (
//         <Loader size="sm" />
//       ) : (
//         <Stack gap="sm">
//           {sessions.map((session) => {
//             const isCurrent = session.sessionId === currentSessionId;

//             return (
//               <Card key={session.sessionId} withBorder padding="sm" radius="sm">
//                 <Group justify="space-between">
//                   <Group>
//                     {getDeviceIcon(session.userAgent || '')}
//                     <div>
//                       <Text size="sm" fw={500}>
//                         {getDeviceName(session.userAgent || '')}
//                         {isCurrent && (
//                           <Badge ml="xs" size="xs" color="green">
//                             Current
//                           </Badge>
//                         )}
//                       </Text>
//                       <Text size="xs" c="dimmed">
//                         {new Date(session.createdAt.seconds * 1000).toLocaleString()}
//                         {' • '}
//                         IP: {session.ip}
//                       </Text>
//                     </div>
//                   </Group>

//                   {!isCurrent && (
//                     <Button
//                       color="red"
//                       variant="subtle"
//                       size="xs"
//                       loading={isRevoking}
//                       onClick={() => revokeSession({ sessionId: session.sessionId })}
//                     >
//                       <IconTrash size={16} />
//                     </Button>
//                   )}
//                 </Group>
//               </Card>
//             );
//           })}
//           {sessions.length === 0 && (
//             <Text c="dimmed" size="sm">
//               No active sessions found.
//             </Text>
//           )}
//         </Stack>
//       )}
//     </Card>
//   );
// }
