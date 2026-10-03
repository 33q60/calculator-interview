// 直接执行工作流内的脚本，所有 GitHub API 都使用桩；不会发送真实邀请。
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const assert = require('node:assert/strict');
const test = require('node:test');

const workflow = readFileSync(join(__dirname, '../.github/workflows/invite.yml'), 'utf8').replace(/\r\n/g, '\n');
const script = workflow.split('          script: |\n')[1];
assert.ok(script, '工作流必须包含待测 script');
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const run = new AsyncFunction('github', 'context', 'core', script);

const apiError = (status) => Object.assign(new Error(`API ${status}`), { status });
function fixture(options = {}) {
  const calls = [];
  const logs = [];
  let memberReads = 0;
  let inviteReads = 0;
  const github = {
    rest: {
      orgs: {
        listMembers: 'members',
        listPendingInvitations: 'invitations',
        listInvitationTeams: 'invitationTeams',
        async createInvitation(params) {
          calls.push(['create', params]);
          if (options.createError) throw options.createError;
          return { data: { id: 99 } };
        },
      },
      teams: {
        listMembersInOrg: 'teamMembers',
        async getByName(params) {
          calls.push(['team', params]);
          assert.deepEqual(params, { org: 'GXMZU-AITECC', team_slug: 'rookies' });
          if (options.teamError) throw options.teamError;
          return { data: { id: options.teamId ?? 678 } };
        },
        async addOrUpdateMembershipForUserInOrg(params) {
          calls.push(['addTeam', params]);
          if (options.addTeamError) throw options.addTeamError;
          return { data: { state: options.teamState ?? 'active' } };
        },
      },
      users: {
        async getByUsername(params) {
          calls.push(['user', params]);
          if (options.userError) throw options.userError;
          return { data: { id: options.userId ?? 12345 } };
        },
      },
    },
    async paginate(endpoint, params) {
      calls.push([endpoint, params]);
      if (endpoint === 'teamMembers') {
        assert.deepEqual(params, { org: 'GXMZU-AITECC', team_slug: 'rookies', role: 'all', per_page: 100 });
        if (options.teamMembersError) throw options.teamMembersError;
        return options.teamMembers ?? [];
      }
      if (endpoint === 'invitationTeams') {
        assert.deepEqual(params, { org: 'GXMZU-AITECC', invitation_id: 99, per_page: 100 });
        if (options.invitationTeamsError) throw options.invitationTeamsError;
        return options.invitationTeams ?? [{ id: 678 }];
      }
      assert.deepEqual(params, { org: 'GXMZU-AITECC', per_page: 100 });
      if (endpoint === 'members') {
        if (options.memberError) throw options.memberError;
        return (memberReads++ > 0 ? options.membersAfter : undefined) ?? options.members ?? [];
      }
      assert.equal(endpoint, 'invitations');
      if (options.inviteError) throw options.inviteError;
      return (inviteReads++ > 0 ? options.invitesAfter : undefined) ?? options.invites ?? [];
    },
  };
  return {
    calls, logs,
    execute: () => run(github, {
      repo: { owner: 'GXMZU-AITECC' },
      payload: { pull_request: { user: { login: 'MOLUOGH' } } },
    }, { info: (message) => logs.push(message) }),
  };
}

for (const [name, options] of [
  ['已在 rookies（用户名大小写不同）', { members: [{ login: 'moluogh' }], teamMembers: [{ login: 'moluogh' }] }],
  ['现有团队维护者不降级', { members: [{ login: 'MOLUOGH' }], teamMembers: [{ login: 'MOLUOGH', role: 'maintainer' }] }],
  ['已有含 rookies 的邀请（忽略无用户名记录）', { invites: [{ login: null }, { login: 'MOLUOGH', id: 99 }] }],
]) {
  test(`${name}：不发邀请，正常结束`, async () => {
    const f = fixture(options);
    await f.execute();
    assert.ok(f.logs.some((line) => line.includes('跳过')));
    assert.ok(!f.calls.some(([name]) => ['create', 'user', 'addTeam'].includes(name)));
  });
}

test('新人：整数用户 ID、整数团队 ID、普通成员角色，仅发送一次含 rookies 的邀请', async () => {
  const f = fixture({ members: [{ login: 'someone-else' }], invites: [{ login: null }] });
  await f.execute();
  assert.deepEqual(f.calls.map(([name]) => name), ['team', 'members', 'invitations', 'user', 'create']);
  assert.deepEqual(f.calls.at(-1)[1], {
    org: 'GXMZU-AITECC', invitee_id: 12345, role: 'direct_member', team_ids: [678],
  });
  assert.ok(f.logs.at(-1).includes('已向 MOLUOGH 发送'));
});

for (const [name, options] of [
  ['团队查询 404', { teamError: apiError(404) }],
  ['团队查询 403', { teamError: apiError(403) }],
  ['团队 ID 无效', { teamId: '678' }],
  ['成员查询 401', { memberError: apiError(401) }],
  ['成员查询 403', { memberError: apiError(403) }],
  ['成员查询 404', { memberError: apiError(404) }],
  ['邀请查询 403', { inviteError: apiError(403) }],
  ['邀请查询 404', { inviteError: apiError(404) }],
  ['邀请查询网络错误', { inviteError: new Error('network unavailable') }],
  ['用户查询 500', { userError: apiError(500) }],
  ['用户 ID 是字符串', { userId: '12345' }],
]) {
  test(`${name}：保留失败，不发送邀请`, async () => {
    const f = fixture(options);
    await assert.rejects(f.execute);
    assert.ok(!f.calls.some(([name]) => name === 'create'));
  });
}

for (const status of [403, 422, 500]) {
  test(`发送邀请 ${status} 且没有已加入/待接受证据：保留原错误`, async () => {
    const error = apiError(status);
    const f = fixture({ createError: error });
    await assert.rejects(f.execute, (actual) => actual === error);
    assert.equal(f.calls.filter(([name]) => name === 'create').length, 1);
  });
}

for (const [name, after] of [
  ['另一任务已邀请', { invitesAfter: [{ login: 'MOLUOGH', id: 99 }] }],
  ['用户已加入', { membersAfter: [{ login: 'MOLUOGH' }] }],
]) {
  test(`发送时 422，复查确认${name}：正常结束且不重发`, async () => {
    const f = fixture({ createError: apiError(422), ...after });
    await f.execute();
    assert.equal(f.calls.filter(([name]) => name === 'create').length, 1);
    if (after.membersAfter) {
      assert.equal(f.calls.filter(([name]) => name === 'addTeam').length, 1);
    } else {
      assert.ok(f.logs.at(-1).includes('跳过'));
    }
  });
}

test('已是组织成员但未入团队：只补入 rookies，不发组织邀请', async () => {
  const f = fixture({ members: [{ login: 'MOLUOGH' }] });
  await f.execute();
  assert.deepEqual(f.calls.filter(([name]) => name === 'addTeam'), [['addTeam', {
    org: 'GXMZU-AITECC', team_slug: 'rookies', username: 'MOLUOGH', role: 'member',
  }]]);
  assert.ok(!f.calls.some(([name]) => name === 'create'));
  assert.ok(f.logs.at(-1).includes('已将组织成员'));
});

test('旧邀请缺 rookies：明确失败提示 Owner，不取消重发、不修改权限', async () => {
  const f = fixture({ invites: [{ login: 'MOLUOGH', id: 99 }], invitationTeams: [{ id: 777 }] });
  await assert.rejects(f.execute, /未包含 rookies.*Owner/);
  assert.ok(!f.calls.some(([name]) => ['create', 'addTeam'].includes(name)));
});

for (const [name, options] of [
  ['团队成员查询 404', { members: [{ login: 'MOLUOGH' }], teamMembersError: apiError(404) }],
  ['团队成员查询 403', { members: [{ login: 'MOLUOGH' }], teamMembersError: apiError(403) }],
  ['邀请团队查询 403', { invites: [{ login: 'MOLUOGH', id: 99 }], invitationTeamsError: apiError(403) }],
]) {
  test(`${name}：查询失败时没有写操作`, async () => {
    const f = fixture(options);
    await assert.rejects(f.execute);
    assert.ok(!f.calls.some(([name]) => ['create', 'addTeam'].includes(name)));
  });
}

test('补入团队权限不足：保留失败，不伪报成功', async () => {
  const error = apiError(403);
  const f = fixture({ members: [{ login: 'MOLUOGH' }], addTeamError: error });
  await assert.rejects(f.execute, (actual) => actual === error);
  assert.equal(f.logs.length, 0);
});

test('补入团队返回 pending：明确尚未生效', async () => {
  const f = fixture({ members: [{ login: 'MOLUOGH' }], teamState: 'pending' });
  await f.execute();
  assert.ok(f.logs.at(-1).includes('尚未生效'));
});

test('补入团队返回未知状态：保留失败', async () => {
  const f = fixture({ members: [{ login: 'MOLUOGH' }], teamState: 'unknown' });
  await assert.rejects(f.execute, /未知成员状态/);
});

test('422 复查发现旧邀请缺团队：仍需人工处理，不能伪报成功', async () => {
  const f = fixture({ createError: apiError(422), invitesAfter: [{ login: 'MOLUOGH', id: 99 }], invitationTeams: [] });
  await assert.rejects(f.execute, /未包含 rookies/);
  assert.equal(f.calls.filter(([name]) => name === 'create').length, 1);
});
