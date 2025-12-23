'use server';

import { UserRoleInOrg } from '@/features/enums';
import { AppPermission } from '@/lib/action-policies';
import { orgActionClient } from '@/lib/safe-action';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { MemberService } from '../services/member.service';

// ----------------------------------------------------------------------------
// Get Members
// ----------------------------------------------------------------------------
export const getMembersAction = orgActionClient
  .metadata({
    name: 'members.list',
    permissions: [AppPermission.MEMBER_VIEW],
  })
  .action(async ({ ctx }) => {
    return await MemberService.getMembers(ctx.orgId);
  });

// ----------------------------------------------------------------------------
// Update Role
// ----------------------------------------------------------------------------
const UpdateRoleSchema = z.object({
  userId: z.string(),
  newRole: z.nativeEnum(UserRoleInOrg),
});

export const updateMemberRoleAction = orgActionClient
  .metadata({
    name: 'members.updateRole',
    permissions: [AppPermission.MEMBER_UPDATE],
  })
  .inputSchema(UpdateRoleSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await MemberService.updateMemberRole(
      ctx.userId,
      ctx.role,
      parsedInput.userId,
      parsedInput.newRole,
      ctx.orgId,
    );

    if (result.success) {
      revalidatePath('/dashboard/team');
    }
    return result;
  });

// ----------------------------------------------------------------------------
// Remove Member
// ----------------------------------------------------------------------------
const RemoveMemberSchema = z.object({
  userId: z.string(),
});

export const removeMemberAction = orgActionClient
  .metadata({
    name: 'members.remove',
    permissions: [AppPermission.MEMBER_REMOVE],
  })
  .inputSchema(RemoveMemberSchema)
  .action(async ({ parsedInput, ctx }) => {
    const result = await MemberService.removeMember(ctx.userId, parsedInput.userId, ctx.orgId);

    if (result.success) {
      revalidatePath('/dashboard/team');
    }
    return result;
  });
