'use server';

import { orgActionClient } from '@/core/safe-action/safe-action';
import { AppPermission, UserRoleInOrg } from '@/lib/action-policies';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { memberService } from '../services/member.service';

const UpdateRoleSchema = z.object({
  userId: z.string(),
  role: z.nativeEnum(UserRoleInOrg),
});

const RemoveMemberSchema = z.object({
  userId: z.string(),
});

export const updateMemberRoleAction = orgActionClient
  .metadata({
    name: 'member.updateRole',
    permissions: [AppPermission.MEMBER_UPDATE],
  })
  .schema(UpdateRoleSchema)
  .action(async ({ ctx, parsedInput }) => {
    const result = await memberService.updateMemberRole(
      ctx.userId,
      ctx.orgId,
      parsedInput.userId,
      parsedInput.role,
    );
    revalidatePath('/dashboard/team');
    return result;
  });

export const removeMemberAction = orgActionClient
  .metadata({
    name: 'member.remove',
    permissions: [AppPermission.MEMBER_DELETE],
  })
  .schema(RemoveMemberSchema)
  .action(async ({ ctx, parsedInput }) => {
    const result = await memberService.removeMember(ctx.userId, ctx.orgId, parsedInput.userId);
    revalidatePath('/dashboard/team');
    return result;
  });
