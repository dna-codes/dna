# DNA Resource Types

This catalog lists every Resource Type defined by DNA, organized by
[Layer](./README.md#layers) — the top-level zones of the organization that
DNA describes (Operational, Product, Technology).

Resource Types are templates — an organization adopts and instantiates them
as `Resource`s in its own graph, possibly under renamed labels. `Person`
may become `Individual`; `Group` may become `Work Unit`; the role each
plays in DNA sentences is unchanged.

Each Resource Type carries **Lenses** — named perspectives on its outgoing
Relationships, the primary unit of navigation into the graph. Lenses are
published in two forms: a markdown bullet list for humans, and a JSON
block for machine consumption (e.g. the Neo4j adapter). The JSON `path`
is an array of pair-anchored
[Relationship Type identifiers](./README.md#relationship-types) in
PascalCase, with `~` prefix for inverse traversal.

The most useful multi-Lens compositions are surfaced as
[Compositions](./compositions/) (e.g. Access Control).

Conventions: Resource Types appear in `Code`. The "Appears in" line lists
the Compositions that compose this type into a DNA sentence. Lens bullets
use the canonical English sentence as the path field (gerund forms allowed
for grammatical flow); the JSON path uses pair-anchored type identifiers.

## Operational Layer

How the organization runs — its people, the work they do, and the
business objects they act on.

### Person
A human in the organization. Not a system identity — purely organizational
reality. A `Person` may use zero, one, or more `User` accounts.

**Lenses:**
- **Positions** — `Person fills Position` — where each person sits in the org structure
- **Groups** — `Person fills Position within Group` — department membership
- **Accounts** — `Person using User` — User accounts this Person uses
- **Roles** — `Person using User has Role` — permitted Roles via this Person's User accounts
- **Activity** — `Person using User performs Action` — what this Person has done via their User accounts

```json
{
  "subject": "Person",
  "lenses": [
    {"name": "Positions", "shows": "where each person sits in the org structure", "path": ["Person_Position"]},
    {"name": "Groups", "shows": "department membership", "path": ["Person_Position", "Position_Group"]},
    {"name": "Accounts", "shows": "User accounts this Person uses", "path": ["Person_User"]},
    {"name": "Roles", "shows": "permitted Roles via this Person's User accounts", "path": ["Person_User", "User_Role"]},
    {"name": "Activity", "shows": "what this Person has done via their User accounts", "path": ["Person_User", "User_Action"]}
  ]
}
```

*Appears in:* [People](./compositions/people.md).

### User
An authenticated actor in a system — the principal of an action. Usually
backed by a `Person`, but service accounts and `Agent`s also act as `User`s
in some contexts.

**Lenses:**
- **Person** — `Person using User` — the Person behind this User
- **Roles** — `User has Role` — granted Roles
- **Memberships** — `User acting through Membership` — active role bindings
- **Activity** — `User performs Action` — Actions this User has performed

```json
{
  "subject": "User",
  "lenses": [
    {"name": "Person", "shows": "the Person behind this User", "path": ["~Person_User"]},
    {"name": "Roles", "shows": "granted Roles", "path": ["User_Role"]},
    {"name": "Memberships", "shows": "active role bindings", "path": ["User_Membership"]},
    {"name": "Activity", "shows": "Actions this User has performed", "path": ["User_Action"]}
  ]
}
```

*Appears in:* [Access Control](./compositions/access-control.md), [Execution](./compositions/execution.md).

### Position
A named seat in the org structure that a `Person` fills (e.g. "Senior Case
Manager"). A `Position` is not a permission `Role`; it is occupancy of a
slot in the organization.

**Lenses:**
- **Holders** — `Person fills Position` — Persons who fill this Position
- **Group** — `Position within Group` — the Group containing this Position
- **Accountabilities** — `Position accountable for Process` — Processes this Position is accountable for

```json
{
  "subject": "Position",
  "lenses": [
    {"name": "Holders", "shows": "Persons who fill this Position", "path": ["~Person_Position"]},
    {"name": "Group", "shows": "the Group containing this Position", "path": ["Position_Group"]},
    {"name": "Accountabilities", "shows": "Processes this Position is accountable for", "path": ["Position_Process"]}
  ]
}
```

*Appears in:* [People](./compositions/people.md), [Ownership](./compositions/ownership.md).

### Group
A collection of `Position`s — a team, department, or unit. Groups can own
`Resource`s and confer `Scope` on their members.

**Lenses:**
- **Positions** — `Position within Group` — Positions in this Group
- **Members** — `Person fills Position within Group` — People in this Group (via the Positions they fill)
- **Owned Resources** — `Group owns Resource` — Resources this Group owns
- **Domain** — `Group within Domain` — the Domain containing this Group

```json
{
  "subject": "Group",
  "lenses": [
    {"name": "Positions", "shows": "Positions in this Group", "path": ["~Position_Group"]},
    {"name": "Members", "shows": "People in this Group (via the Positions they fill)", "path": ["~Position_Group", "~Person_Position"]},
    {"name": "Owned Resources", "shows": "Resources this Group owns", "path": ["Group_Resource"]},
    {"name": "Domain", "shows": "the Domain containing this Group", "path": ["Group_Domain"]}
  ]
}
```

*Appears in:* [People](./compositions/people.md), [Ownership](./compositions/ownership.md).

### Domain
A hierarchical business area. `Domain`s hold `Process`es, `Resource`s,
and sub-`Domain`s, addressable as a dotted path (e.g.
`acme_corp.finance.payments`). The Domain hierarchy is the structural
backbone the organization is divided into.

**Lenses:**
- **Processes** — `Domain holds Process` — Processes in this Domain
- **Resources** — `Domain holds Process operating on Resource` — Resources operated on by Processes in this Domain
- **Sub-domains** — `Domain holds Domain` — child Domains
- **Parent** — `Domain holds Domain` — the parent Domain, if any
- **Groups** — `Group within Domain` — Groups in this Domain

```json
{
  "subject": "Domain",
  "lenses": [
    {"name": "Processes", "shows": "Processes in this Domain", "path": ["Domain_Process"]},
    {"name": "Resources", "shows": "Resources operated on by Processes in this Domain", "path": ["Domain_Process", "Process_Resource"]},
    {"name": "Sub-domains", "shows": "child Domains", "path": ["Domain_Domain"]},
    {"name": "Parent", "shows": "the parent Domain, if any", "path": ["~Domain_Domain"]},
    {"name": "Groups", "shows": "Groups in this Domain", "path": ["~Group_Domain"]}
  ]
}
```

*Appears in:* [Domain](./compositions/domain.md), [People](./compositions/people.md), [Access Control](./compositions/access-control.md) (as `Scope`).

#### Scope (as Domain reference)
`Scope` is not its own Resource Type. It is a node in the `Domain`
hierarchy selected as an authorization boundary by an
[Access Control](./compositions/access-control.md) grant. The same Domain
node `acme_corp.finance` may serve as a `Scope` in one sentence and just
be a `Domain` in another; the role it plays is contextual. The
`Role_Domain` Relationship Type is what binds a Role to its Scope.

### Role
A named bundle of permitted `Action`s. A `Role` is a standing definition,
not an assignment — assignment is expressed by `User has Role`.

**Lenses:**
- **Holders** — `User has Role` — Users assigned this Role
- **Grants** — `Role granting Action` — Actions this Role unlocks
- **Scope** — `Role within Domain` — the Domain node serving as authorization boundary

```json
{
  "subject": "Role",
  "lenses": [
    {"name": "Holders", "shows": "Users assigned this Role", "path": ["~User_Role"]},
    {"name": "Grants", "shows": "Actions this Role unlocks", "path": ["Role_Action"]},
    {"name": "Scope", "shows": "the Domain node serving as authorization boundary", "path": ["Role_Domain"]}
  ]
}
```

*Appears in:* [Access Control](./compositions/access-control.md), [Agent](./compositions/agent.md).

### Membership
The binding Resource that connects a `User` to a `Role` at the moment of
action. Standing `has Role` (Access Control) becomes `acting through
Membership` (Execution) when an action is actually performed.

**Lenses:**
- **User** — `Membership belongs to User` — the User in this binding
- **Role** — `Membership for Role` — the Role in this binding
- **Events** — `Event under Membership` — Events recorded under this Membership

```json
{
  "subject": "Membership",
  "lenses": [
    {"name": "User", "shows": "the User in this binding", "path": ["Membership_User"]},
    {"name": "Role", "shows": "the Role in this binding", "path": ["Membership_Role"]},
    {"name": "Events", "shows": "Events recorded under this Membership", "path": ["~Event_Membership"]}
  ]
}
```

*Appears in:* [Execution](./compositions/execution.md).

### Action
A named operation that can be performed against a `Resource` (e.g. `read`,
`approve`, `transition`). The unit of capability — granted by `Role`s,
performed by `User`s and `Agent`s, implemented by `Story`s.

**Lenses:**
- **Targets** — `Action against Resource` — Resources this Action operates on
- **Granters** — `Role granting Action` — Roles that grant this Action
- **Performers (Users)** — `User performs Action` — Users who have performed this Action
- **Performers (Agents)** — `Agent performs Action` — Agents who have performed this Action
- **Implementers** — `Story implements Action` — Stories that implement this Action
- **Transitions** — `Action causing Transition` — State Transitions this Action causes

```json
{
  "subject": "Action",
  "lenses": [
    {"name": "Targets", "shows": "Resources this Action operates on", "path": ["Action_Resource"]},
    {"name": "Granters", "shows": "Roles that grant this Action", "path": ["~Role_Action"]},
    {"name": "Performers (Users)", "shows": "Users who have performed this Action", "path": ["~User_Action"]},
    {"name": "Performers (Agents)", "shows": "Agents who have performed this Action", "path": ["~Agent_Action"]},
    {"name": "Implementers", "shows": "Stories that implement this Action", "path": ["~Story_Action"]},
    {"name": "Transitions", "shows": "State Transitions this Action causes", "path": ["Action_Transition"]}
  ]
}
```

*Appears in:* [Access Control](./compositions/access-control.md), [Execution](./compositions/execution.md), [Process](./compositions/process.md), [Product](./compositions/product.md), [Delivery](./compositions/delivery.md), [Agent](./compositions/agent.md).

### Process
An orchestrated sequence of `Action`s across `Resource`s, traversing
`State`s. The "how work happens" Resource Type — distinct from `Action`
(atomic) and from runtime executions of a Process.

**Lenses:**
- **Steps** — `Process orchestrates Action` — Actions in this Process
- **Resources** — `Process operating on Resource` — Resources this Process operates on
- **Domain** — `Domain holds Process` — the Domain containing this Process
- **Accountable** — `Position accountable for Process` — the Position accountable for this Process

```json
{
  "subject": "Process",
  "lenses": [
    {"name": "Steps", "shows": "Actions in this Process", "path": ["Process_Action"]},
    {"name": "Resources", "shows": "Resources this Process operates on", "path": ["Process_Resource"]},
    {"name": "Domain", "shows": "the Domain containing this Process", "path": ["~Domain_Process"]},
    {"name": "Accountable", "shows": "the Position accountable for this Process", "path": ["~Position_Process"]}
  ]
}
```

*Appears in:* [Domain](./compositions/domain.md), [Process](./compositions/process.md), [Ownership](./compositions/ownership.md).

### State
A named condition a `Resource` can be in (e.g. `Pending`, `Approved`,
`Filed`). `State`s are the nodes a `Resource` transitions through over
its lifecycle.

**Lenses:**
- **Arriving Transitions** — `Transition to State` — Transitions arriving at this State
- **Departing Transitions** — `Transition from State` — Transitions leaving this State

```json
{
  "subject": "State",
  "lenses": [
    {"name": "Arriving Transitions", "shows": "Transitions arriving at this State", "path": ["~Transition_ToState"]},
    {"name": "Departing Transitions", "shows": "Transitions leaving this State", "path": ["~Transition_FromState"]}
  ]
}
```

*Appears in:* [Execution](./compositions/execution.md), [Process](./compositions/process.md), [Lifecycle](./compositions/lifecycle.md).

### Resource
A business object that `Action`s operate on (e.g. `Plaintiff Record`,
`Document`, `Case`). Orgs typically specialize `Resource` into
domain-specific Resource Types. Every `Resource` instance progresses
through `State`s.

**Lenses:**
- **Lifecycle** — `Transition of Resource to State` — States this Resource has transitioned through
- **Owners** — `Group owns Resource` — Groups that own this Resource
- **Actions** — `Action against Resource` — Actions performed against this Resource
- **Events** — `Event on Resource` — Events involving this Resource

```json
{
  "subject": "Resource",
  "lenses": [
    {"name": "Lifecycle", "shows": "States this Resource has transitioned through", "path": ["~Transition_Resource", "Transition_ToState"]},
    {"name": "Owners", "shows": "Groups that own this Resource", "path": ["~Group_Resource"]},
    {"name": "Actions", "shows": "Actions performed against this Resource", "path": ["~Action_Resource"]},
    {"name": "Events", "shows": "Events involving this Resource", "path": ["~Event_Resource"]}
  ]
}
```

*Appears in:* nearly every Composition.

### Event
A record of something that happened — the immutable log entry of an
`Action` performed by a `User` `acting through Membership`.

**Lenses:**
- **Actor** — `Event by User` — the User who acted
- **Action** — `Event of Action` — the Action recorded
- **Resource** — `Event on Resource` — the Resource targeted
- **Membership** — `Event under Membership` — the Membership in effect
- **Transition** — `Event yielding Transition` — the State Transition caused, if any

```json
{
  "subject": "Event",
  "lenses": [
    {"name": "Actor", "shows": "the User who acted", "path": ["Event_User"]},
    {"name": "Action", "shows": "the Action recorded", "path": ["Event_Action"]},
    {"name": "Resource", "shows": "the Resource targeted", "path": ["Event_Resource"]},
    {"name": "Membership", "shows": "the Membership in effect", "path": ["Event_Membership"]},
    {"name": "Transition", "shows": "the State Transition caused, if any", "path": ["Event_Transition"]}
  ]
}
```

*Appears in:* [Execution](./compositions/execution.md).

### Transition
A change in `State` of a `Resource`, caused by an `Action`. The
consequence-bearing object in the Execution sentence.

**Lenses:**
- **From** — `Transition from State` — the prior State
- **To** — `Transition to State` — the new State
- **Resource** — `Transition of Resource` — the Resource that transitioned
- **Action** — `Action causing Transition` — the Action that caused this Transition
- **Event** — `Event yielding Transition` — the Event recording this Transition

```json
{
  "subject": "Transition",
  "lenses": [
    {"name": "From", "shows": "the prior State", "path": ["Transition_FromState"]},
    {"name": "To", "shows": "the new State", "path": ["Transition_ToState"]},
    {"name": "Resource", "shows": "the Resource that transitioned", "path": ["Transition_Resource"]},
    {"name": "Action", "shows": "the Action that caused this Transition", "path": ["~Action_Transition"]},
    {"name": "Event", "shows": "the Event recording this Transition", "path": ["~Event_Transition"]}
  ]
}
```

*Appears in:* [Execution](./compositions/execution.md), [Lifecycle](./compositions/lifecycle.md).

## Product Layer

What the organization delivers — software offerings and the delivery work
that produces them.

### Product
A software offering — a coherent capability surface delivered to users.
Container for `Module`s.

**Lenses:**
- **Modules** — `Product contains Module` — Modules in this Product
- **Pages** — `Product contains Module containing Page` — Pages across all Modules
- **Actions** — `Product contains Module containing Page enabling Action` — Actions exposed via Pages in this Product

```json
{
  "subject": "Product",
  "lenses": [
    {"name": "Modules", "shows": "Modules in this Product", "path": ["Product_Module"]},
    {"name": "Pages", "shows": "Pages across all Modules in this Product", "path": ["Product_Module", "Module_Page"]},
    {"name": "Actions", "shows": "Actions exposed via Pages in this Product", "path": ["Product_Module", "Module_Page", "Page_Action"]}
  ]
}
```

*Appears in:* [Product](./compositions/product.md).

### Module
A capability unit within a `Product` — a feature area composed of `Page`s.

**Lenses:**
- **Product** — `Product contains Module` — the Product this Module belongs to
- **Pages** — `Module contains Page` — Pages in this Module
- **Actions** — `Module contains Page enabling Action` — Actions exposed via Pages in this Module

```json
{
  "subject": "Module",
  "lenses": [
    {"name": "Product", "shows": "the Product this Module belongs to", "path": ["~Product_Module"]},
    {"name": "Pages", "shows": "Pages in this Module", "path": ["Module_Page"]},
    {"name": "Actions", "shows": "Actions exposed via Pages in this Module", "path": ["Module_Page", "Page_Action"]}
  ]
}
```

*Appears in:* [Product](./compositions/product.md).

### Page
A UI surface within a `Module` that exposes `Action`s to users.

**Lenses:**
- **Module** — `Module contains Page` — the Module this Page belongs to
- **Actions** — `Page enabling Action` — Actions this Page exposes

```json
{
  "subject": "Page",
  "lenses": [
    {"name": "Module", "shows": "the Module this Page belongs to", "path": ["~Module_Page"]},
    {"name": "Actions", "shows": "Actions this Page exposes", "path": ["Page_Action"]}
  ]
}
```

*Appears in:* [Product](./compositions/product.md).

### Initiative
A focused effort to deliver an outcome. Composed of `Epic`s. The unit at
which strategy meets delivery.

**Lenses:**
- **Epics** — `Initiative comprises Epic` — Epics in this Initiative
- **Stories** — `Initiative comprises Epic comprising Story` — Stories across all Epics
- **Actions** — `Initiative comprises Epic comprising Story implements Action` — Actions implemented under this Initiative

```json
{
  "subject": "Initiative",
  "lenses": [
    {"name": "Epics", "shows": "Epics in this Initiative", "path": ["Initiative_Epic"]},
    {"name": "Stories", "shows": "Stories across all Epics in this Initiative", "path": ["Initiative_Epic", "Epic_Story"]},
    {"name": "Actions", "shows": "Actions implemented under this Initiative", "path": ["Initiative_Epic", "Epic_Story", "Story_Action"]}
  ]
}
```

*Appears in:* [Delivery](./compositions/delivery.md).

### Epic
A large body of delivery work, composed of `Story`s and scoped to an
`Initiative`.

**Lenses:**
- **Initiative** — `Initiative comprises Epic` — the Initiative this Epic belongs to
- **Stories** — `Epic comprises Story` — Stories in this Epic
- **Actions** — `Epic comprises Story implements Action` — Actions implemented by Stories in this Epic

```json
{
  "subject": "Epic",
  "lenses": [
    {"name": "Initiative", "shows": "the Initiative this Epic belongs to", "path": ["~Initiative_Epic"]},
    {"name": "Stories", "shows": "Stories in this Epic", "path": ["Epic_Story"]},
    {"name": "Actions", "shows": "Actions implemented by Stories in this Epic", "path": ["Epic_Story", "Story_Action"]}
  ]
}
```

*Appears in:* [Delivery](./compositions/delivery.md).

### Story
A unit of delivery work. A `Story` `implements` an `Action` against a
`Resource`, closing the loop between delivery and operational capability.

**Lenses:**
- **Epic** — `Epic comprises Story` — the Epic this Story belongs to
- **Action** — `Story implements Action` — the Action this Story implements

```json
{
  "subject": "Story",
  "lenses": [
    {"name": "Epic", "shows": "the Epic this Story belongs to", "path": ["~Epic_Story"]},
    {"name": "Action", "shows": "the Action this Story implements", "path": ["Story_Action"]}
  ]
}
```

*Appears in:* [Delivery](./compositions/delivery.md).

## Technology Layer

The infrastructure and automation that enables the organization to operate.
Sparsely populated for now — AI is the only sub-domain currently modeled.

### Agent
A non-human actor (typically AI). Operationally a first-class peer to
`User` — `Agent`s `assume Role`s within `Scope`s and perform `Action`s
against `Resource`s, with the same Constraint properties as humans.

**Lenses:**
- **Roles** — `Agent assumes Role` — Roles this Agent assumes
- **Activity** — `Agent performs Action` — Actions this Agent has performed
- **Capabilities** — `Agent equipped with Capability` — Capabilities this Agent has
- **Capable Actions** — `Agent equipped with Capability includes Action` — Actions this Agent is capable of, via Capabilities

```json
{
  "subject": "Agent",
  "lenses": [
    {"name": "Roles", "shows": "Roles this Agent assumes", "path": ["Agent_Role"]},
    {"name": "Activity", "shows": "Actions this Agent has performed", "path": ["Agent_Action"]},
    {"name": "Capabilities", "shows": "Capabilities this Agent has", "path": ["Agent_Capability"]},
    {"name": "Capable Actions", "shows": "Actions this Agent is capable of, via Capabilities", "path": ["Agent_Capability", "Capability_Action"]}
  ]
}
```

*Appears in:* [Agent](./compositions/agent.md).

### Capability
The set of `Action`s an `Agent` is able to perform. Distinct from `Role`:
`Role` is permission (what is allowed); `Capability` is competence (what
is technically possible for this agent).

**Lenses:**
- **Agents** — `Agent equipped with Capability` — Agents with this Capability
- **Actions** — `Capability includes Action` — Actions this Capability covers

```json
{
  "subject": "Capability",
  "lenses": [
    {"name": "Agents", "shows": "Agents with this Capability", "path": ["~Agent_Capability"]},
    {"name": "Actions", "shows": "Actions this Capability covers", "path": ["Capability_Action"]}
  ]
}
```

*Appears in:* [Agent](./compositions/agent.md).

## Open questions

- **Idea.** The Delivery sentence (`Idea becomes Initiative…`) opens with
  `Idea`, but `Idea` is not in the Product Layer above. Decide whether it's
  a Product Layer Resource Type (with `Idea_Initiative` *becomes* as its
  Relationship Type) or a pre-Resource concept.
- **Workflow / Task.** Earlier framings included `Workflow` (a runtime
  instance of a `Process`) and `Task` (a unit of human work). Both are
  absent here. Decide whether they belong in Operational.
- **Resource's current State.** The Lifecycle Lens lists all States a
  Resource has been in; it does not single out the *current* state.
  Worth deciding whether a Resource has a direct `Resource_State`
  Relationship for the current value, or whether it's derived from the
  most recent Transition.
- **Technology Layer breadth.** Only `Agent` and `Capability` live here.
  Earlier framings included `Platform`, `Service`, `API`, `Event`
  (separate from operational Event?), `Integration`, `Environment`,
  `Identity`, `Infrastructure`. Populate as needed.
- **Purpose Layer (deferred).** `Mission`, `Goal`, `Outcome`, `Metric`,
  `Policy` — a 4th Layer covering strategic intent. Out of scope for now;
  revisit when DNA needs to model strategy.
