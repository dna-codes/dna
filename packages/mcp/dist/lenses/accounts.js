"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAccounts = buildAccounts;
async function buildAccounts(store) {
    const [accounts, contacts, opportunities, allLinks] = await Promise.all([
        store.instance.list('account').catch(() => []),
        store.instance.list('contact').catch(() => []),
        store.instance.list('opportunity').catch(() => []),
        store.link.list(),
    ]);
    const contactById = new Map(contacts.map(c => [c.id, String(c.name ?? c.id)]));
    const oppById = new Map(opportunities.map(o => [o.id, String(o.name ?? o.id)]));
    // Determine which opportunities are closed (have a converts_to deal link)
    const closedOppIds = new Set();
    for (const link of allLinks) {
        if (link.from.typeName === 'opportunity' && link.to.typeName === 'deal') {
            closedOppIds.add(link.from.id);
        }
    }
    const accountOwner = new Map();
    const accountOpps = new Map();
    const accountActivities = new Map();
    for (const link of allLinks) {
        const { from, to } = link;
        // owned_by: account -> contact
        if (from.typeName === 'account' && to.typeName === 'contact') {
            const name = contactById.get(to.id);
            if (name)
                accountOwner.set(from.id, name);
        }
        // opportunity belongs_to account
        if (from.typeName === 'opportunity' && to.typeName === 'account') {
            const oppName = oppById.get(from.id);
            if (oppName) {
                const list = accountOpps.get(to.id) ?? [];
                list.push({ id: from.id, name: oppName, status: closedOppIds.has(from.id) ? 'closed' : 'open' });
                accountOpps.set(to.id, list);
            }
        }
        // has_activity: account -> activity
        if (from.typeName === 'account' && to.typeName === 'activity') {
            accountActivities.set(from.id, (accountActivities.get(from.id) ?? 0) + 1);
        }
    }
    const result = accounts.map(acc => ({
        id: acc.id,
        name: String(acc.name ?? acc.id),
        owner: accountOwner.get(acc.id) ?? null,
        opportunities: accountOpps.get(acc.id) ?? [],
        activityCount: accountActivities.get(acc.id) ?? 0,
    }));
    return { lens: 'accounts', accounts: result };
}
//# sourceMappingURL=accounts.js.map