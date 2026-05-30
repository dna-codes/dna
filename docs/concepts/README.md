# DNA Concepts

DNA is a unified operational graph of an organization. Every claim about the
org — who reports to whom, who can do what, how work flows, what owns what —
is expressed as a DNA sentence and stored as graph relationships.

Resource Types are organized into [Layers](#layers) (Operational, Product,
Technology). Each Resource Type carries [Lenses](#lenses) — perspectives
on its outgoing Relationships. The most useful multi-Lens compositions are
surfaced as [Compositions](#compositions).

## Metamodel

DNA is a property graph with two axes:

| | Definition (in DNA) | Instance (in org's graph) |
|---|---|---|
| **Things** | Resource Type | Resource |
| **Connections** | Relationship Type | Relationship |

An org adopts DNA by instantiating Resource Types as `Resource`s in its
own graph — often under renamed labels (`Person` → `Individual`, `Group`
→ `Work Unit`) — and connecting them with `Relationship`s of the documented
Relationship Types. Modifiers like `Constraints` attach as **properties on
Relationships**.

## Layers

Resource Types are organized into three Layers that represent the part of
the organization each describes.

| Layer | Covers | Resource Types |
|---|---|---|
| **Operational** | How the organization runs | `Person`, `User`, `Position`, `Group`, `Domain`, `Role`, `Membership`, `Action`, `Process`, `State`, `Resource`, `Event`, `Transition` |
| **Product** | What the organization delivers | `Product`, `Module`, `Page`, `Initiative`, `Epic`, `Story` |
| **Technology** | Infrastructure and automation | `Agent`, `Capability` |

The full catalog with definitions lives in
[Resource Types](./resource-types.md). The Purpose Layer (Mission, Goal,
Outcome, Metric, Policy) is deferred; DNA currently stops at operational
reality.

## Lenses

A **Lens** is a named perspective on a Resource Type's outgoing
Relationships — the primary unit of navigation into the graph. For
example, `Person` exposes a "Positions" lens (its `fills` Relationships),
a "Groups" lens (departments, via Position), and a "Roles" lens (via the
`User` this Person uses). Lenses are documented per Resource Type in
[Resource Types](./resource-types.md).

Each Resource Type ships Lenses in two forms: a markdown bullet list for
humans and a JSON block for machines (the Neo4j adapter and other query
tooling). JSON schema:

```json
{
  "subject": "<Resource Type>",
  "lenses": [
    {
      "name": "<Lens name>",
      "shows": "<what it shows>",
      "path": ["<Relationship Type identifier>"]
    }
  ]
}
```

Each `path` entry is a [Relationship Type](#relationship-types) identifier
in PascalCase (`Person_Position`, `Module_Page`, …). Prefix with `~` to
walk the relationship inversely — `~Person_Position` walks from a
Position node back to the Person(s) that fill it. Paths can be any
number of hops; each hop's end Resource Type is the next hop's start.

## Compositions

The most useful multi-Lens compositions are captured with their own names
and sentence-templates. Each Composition binds several Lenses
(sometimes across Layers) into a single recognized pattern.

| Name | What it answers |
|---|---|
| [People](./compositions/people.md) | Who works where in the org structure |
| [Access Control](./compositions/access-control.md) | What an actor is permitted to do |
| [Execution](./compositions/execution.md) | What an actor actually did |
| [Domain](./compositions/domain.md) | What business areas exist and what they cover |
| [Process](./compositions/process.md) | How work flows |
| [Lifecycle](./compositions/lifecycle.md) | How a `Resource` progresses through `State`s |
| [Product](./compositions/product.md) | How software is composed |
| [Delivery](./compositions/delivery.md) | How ideas become shipped capabilities |
| [Agent](./compositions/agent.md) | The Access Control shape with non-human actors |
| [Ownership](./compositions/ownership.md) | Who owns what and is accountable for which processes |

## Relationship Types

DNA's Relationship Types are **pair-anchored**: each one has a fixed
start and end Resource Type. Every type has a PascalCase identifier
(used as the graph edge label) and an English descriptor (used in DNA
sentences). For example, `Person_Position` connects `Person` to
`Position`; its descriptor is *fills*, and it appears in the sentence
`Person fills Position`.

Descriptors are mostly unique per type, with a small number of intentional
repeats where natural English doesn't admit a distinct word: *within*
for every containment-as-boundary case, *performs* for both `User` and
`Agent` acting on `Action`, *contains* across the two software-composition
pairs. Multi-word descriptors are written as the dictionary form (e.g.
*contains*); sentences may use the gerund (*containing*) for grammatical
flow.

| Type | Descriptor | Sentence |
|---|---|---|
| `Action_Resource` | *against* | `Action against Resource` |
| `Action_Transition` | *causing* | `Action causing Transition` |
| `Agent_Action` | *performs* | `Agent performs Action` |
| `Agent_Capability` | *equipped with* | `Agent equipped with Capability` |
| `Agent_Role` | *assumes* | `Agent assumes Role` |
| `Capability_Action` | *includes* | `Capability includes Action` |
| `Domain_Domain` | *holds* | `Domain holds Domain` |
| `Domain_Process` | *holds* | `Domain holds Process` |
| `Epic_Story` | *comprises* | `Epic comprises Story` |
| `Event_Action` | *of* | `Event of Action` |
| `Event_Membership` | *under* | `Event under Membership` |
| `Event_Resource` | *on* | `Event on Resource` |
| `Event_Transition` | *yielding* | `Event yielding Transition` |
| `Event_User` | *by* | `Event by User` |
| `Group_Domain` | *within* | `Group within Domain` |
| `Group_Resource` | *owns* | `Group owns Resource` |
| `Initiative_Epic` | *comprises* | `Initiative comprises Epic` |
| `Membership_Role` | *for* | `Membership for Role` |
| `Membership_User` | *belongs to* | `Membership belongs to User` |
| `Module_Page` | *contains* | `Module contains Page` |
| `Page_Action` | *enabling* | `Page enabling Action` |
| `Person_Position` | *fills* | `Person fills Position` |
| `Person_User` | *using* | `Person using User` |
| `Position_Group` | *within* | `Position within Group` |
| `Position_Process` | *accountable for* | `Position accountable for Process` |
| `Process_Action` | *orchestrates* | `Process orchestrates Action` |
| `Process_Resource` | *operating on* | `Process operating on Resource` |
| `Product_Module` | *contains* | `Product contains Module` |
| `Role_Action` | *granting* | `Role granting Action` |
| `Role_Domain` | *within* | `Role within Domain` *(Scope)* |
| `Story_Action` | *implements* | `Story implements Action` |
| `Transition_FromState` | *from* | `Transition from State` |
| `Transition_Resource` | *of* | `Transition of Resource` |
| `Transition_ToState` | *to* | `Transition to State` |
| `User_Action` | *performs* | `User performs Action` |
| `User_Membership` | *through* | `User acting through Membership` |
| `User_Role` | *has* | `User has Role` |

Avoid: *inside* (use *within*), *via* (use *through*).

`subject to Constraints` is not in the table above — it is a modifier
that attaches as a property on any Relationship, not a pair-anchored
type. See [Modifiers](#modifiers).

## Modifiers

Any DNA sentence may be suffixed with an optional modifier expressing a
cross-cutting concern not specific to the view. Modifiers appear in square
brackets at the end of the DNA sentence in each view doc. At instantiation,
modifiers attach as **properties on Relationships** in the org's graph.

### Constraints

`subject to Constraints` — runtime predicates evaluated when the
Relationship is acted on, stored as a `Constraints` property on the
Relationship. Constraints decompose into three predicate kinds:

| Kind | About | Example |
|---|---|---|
| Subject | The actor | `User.department == 'Finance'` |
| Resource | The target | `Document.owner == User` (i.e. "own") |
| Environmental | Context | `time.hour < 18`, `mfa.satisfied` |

Constraints compose with `AND`. Shorthand expressions like
`documents:read:own` decode as a Resource predicate:
`Document.owner == User`.
