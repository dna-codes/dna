import { z } from 'zod';
export declare const addInstanceOp: z.ZodObject<{
    op: z.ZodLiteral<"add_instance">;
    type: z.ZodString;
    name: z.ZodString;
    attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const removeInstanceOp: z.ZodObject<{
    op: z.ZodLiteral<"remove_instance">;
    id: z.ZodString;
    type: z.ZodString;
}, z.core.$strip>;
export declare const updateInstanceOp: z.ZodObject<{
    op: z.ZodLiteral<"update_instance">;
    id: z.ZodString;
    type: z.ZodString;
    attributes: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, z.core.$strip>;
export declare const addLinkOp: z.ZodObject<{
    op: z.ZodLiteral<"add_link">;
    type: z.ZodString;
    from: z.ZodString;
    to: z.ZodString;
}, z.core.$strip>;
export declare const removeLinkOp: z.ZodObject<{
    op: z.ZodLiteral<"remove_link">;
    id: z.ZodString;
}, z.core.$strip>;
export declare const addResourceTypeOp: z.ZodObject<{
    op: z.ZodLiteral<"add_resource_type">;
    name: z.ZodString;
    category: z.ZodEnum<{
        person: "person";
        role: "role";
        group: "group";
        resource: "resource";
    }>;
    description: z.ZodOptional<z.ZodString>;
    stability: z.ZodOptional<z.ZodEnum<{
        experimental: "experimental";
        beta: "beta";
        stable: "stable";
        deprecated: "deprecated";
    }>>;
    attribute_schema: z.ZodOptional<z.ZodArray<z.ZodUnknown>>;
}, z.core.$strip>;
export declare const addRelationshipTypeOp: z.ZodObject<{
    op: z.ZodLiteral<"add_relationship_type">;
    name: z.ZodString;
    from_type: z.ZodString;
    to_type: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    stability: z.ZodOptional<z.ZodEnum<{
        experimental: "experimental";
        beta: "beta";
        stable: "stable";
        deprecated: "deprecated";
    }>>;
}, z.core.$strip>;
/** Discriminated union over every supported patch operation. */
export declare const patchOpSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    op: z.ZodLiteral<"add_instance">;
    type: z.ZodString;
    name: z.ZodString;
    attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>, z.ZodObject<{
    op: z.ZodLiteral<"remove_instance">;
    id: z.ZodString;
    type: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    op: z.ZodLiteral<"update_instance">;
    id: z.ZodString;
    type: z.ZodString;
    attributes: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, z.core.$strip>, z.ZodObject<{
    op: z.ZodLiteral<"add_link">;
    type: z.ZodString;
    from: z.ZodString;
    to: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    op: z.ZodLiteral<"remove_link">;
    id: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    op: z.ZodLiteral<"add_resource_type">;
    name: z.ZodString;
    category: z.ZodEnum<{
        person: "person";
        role: "role";
        group: "group";
        resource: "resource";
    }>;
    description: z.ZodOptional<z.ZodString>;
    stability: z.ZodOptional<z.ZodEnum<{
        experimental: "experimental";
        beta: "beta";
        stable: "stable";
        deprecated: "deprecated";
    }>>;
    attribute_schema: z.ZodOptional<z.ZodArray<z.ZodUnknown>>;
}, z.core.$strip>, z.ZodObject<{
    op: z.ZodLiteral<"add_relationship_type">;
    name: z.ZodString;
    from_type: z.ZodString;
    to_type: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    stability: z.ZodOptional<z.ZodEnum<{
        experimental: "experimental";
        beta: "beta";
        stable: "stable";
        deprecated: "deprecated";
    }>>;
}, z.core.$strip>], "op">;
/**
 * Raw shape registered as the `patch_graph` tool input. The MCP SDK converts
 * this to the JSON Schema advertised to clients.
 */
export declare const patchGraphInputShape: {
    ops: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        op: z.ZodLiteral<"add_instance">;
        type: z.ZodString;
        name: z.ZodString;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>, z.ZodObject<{
        op: z.ZodLiteral<"remove_instance">;
        id: z.ZodString;
        type: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        op: z.ZodLiteral<"update_instance">;
        id: z.ZodString;
        type: z.ZodString;
        attributes: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, z.core.$strip>, z.ZodObject<{
        op: z.ZodLiteral<"add_link">;
        type: z.ZodString;
        from: z.ZodString;
        to: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        op: z.ZodLiteral<"remove_link">;
        id: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        op: z.ZodLiteral<"add_resource_type">;
        name: z.ZodString;
        category: z.ZodEnum<{
            person: "person";
            role: "role";
            group: "group";
            resource: "resource";
        }>;
        description: z.ZodOptional<z.ZodString>;
        stability: z.ZodOptional<z.ZodEnum<{
            experimental: "experimental";
            beta: "beta";
            stable: "stable";
            deprecated: "deprecated";
        }>>;
        attribute_schema: z.ZodOptional<z.ZodArray<z.ZodUnknown>>;
    }, z.core.$strip>, z.ZodObject<{
        op: z.ZodLiteral<"add_relationship_type">;
        name: z.ZodString;
        from_type: z.ZodString;
        to_type: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        stability: z.ZodOptional<z.ZodEnum<{
            experimental: "experimental";
            beta: "beta";
            stable: "stable";
            deprecated: "deprecated";
        }>>;
    }, z.core.$strip>], "op">>;
};
/** JSON Schema for a single patch operation (the discriminated union). */
export declare const PATCH_OPS_SCHEMA: z.core.ZodStandardJSONSchemaPayload<z.ZodDiscriminatedUnion<[z.ZodObject<{
    op: z.ZodLiteral<"add_instance">;
    type: z.ZodString;
    name: z.ZodString;
    attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>, z.ZodObject<{
    op: z.ZodLiteral<"remove_instance">;
    id: z.ZodString;
    type: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    op: z.ZodLiteral<"update_instance">;
    id: z.ZodString;
    type: z.ZodString;
    attributes: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, z.core.$strip>, z.ZodObject<{
    op: z.ZodLiteral<"add_link">;
    type: z.ZodString;
    from: z.ZodString;
    to: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    op: z.ZodLiteral<"remove_link">;
    id: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    op: z.ZodLiteral<"add_resource_type">;
    name: z.ZodString;
    category: z.ZodEnum<{
        person: "person";
        role: "role";
        group: "group";
        resource: "resource";
    }>;
    description: z.ZodOptional<z.ZodString>;
    stability: z.ZodOptional<z.ZodEnum<{
        experimental: "experimental";
        beta: "beta";
        stable: "stable";
        deprecated: "deprecated";
    }>>;
    attribute_schema: z.ZodOptional<z.ZodArray<z.ZodUnknown>>;
}, z.core.$strip>, z.ZodObject<{
    op: z.ZodLiteral<"add_relationship_type">;
    name: z.ZodString;
    from_type: z.ZodString;
    to_type: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    stability: z.ZodOptional<z.ZodEnum<{
        experimental: "experimental";
        beta: "beta";
        stable: "stable";
        deprecated: "deprecated";
    }>>;
}, z.core.$strip>], "op">>;
/** JSON Schema for the full `patch_graph` tool input `{ ops: PatchOp[] }`. */
export declare const PATCH_GRAPH_INPUT_SCHEMA: z.core.ZodStandardJSONSchemaPayload<z.ZodObject<{
    ops: z.ZodArray<z.ZodDiscriminatedUnion<[z.ZodObject<{
        op: z.ZodLiteral<"add_instance">;
        type: z.ZodString;
        name: z.ZodString;
        attributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, z.core.$strip>, z.ZodObject<{
        op: z.ZodLiteral<"remove_instance">;
        id: z.ZodString;
        type: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        op: z.ZodLiteral<"update_instance">;
        id: z.ZodString;
        type: z.ZodString;
        attributes: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    }, z.core.$strip>, z.ZodObject<{
        op: z.ZodLiteral<"add_link">;
        type: z.ZodString;
        from: z.ZodString;
        to: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        op: z.ZodLiteral<"remove_link">;
        id: z.ZodString;
    }, z.core.$strip>, z.ZodObject<{
        op: z.ZodLiteral<"add_resource_type">;
        name: z.ZodString;
        category: z.ZodEnum<{
            person: "person";
            role: "role";
            group: "group";
            resource: "resource";
        }>;
        description: z.ZodOptional<z.ZodString>;
        stability: z.ZodOptional<z.ZodEnum<{
            experimental: "experimental";
            beta: "beta";
            stable: "stable";
            deprecated: "deprecated";
        }>>;
        attribute_schema: z.ZodOptional<z.ZodArray<z.ZodUnknown>>;
    }, z.core.$strip>, z.ZodObject<{
        op: z.ZodLiteral<"add_relationship_type">;
        name: z.ZodString;
        from_type: z.ZodString;
        to_type: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        stability: z.ZodOptional<z.ZodEnum<{
            experimental: "experimental";
            beta: "beta";
            stable: "stable";
            deprecated: "deprecated";
        }>>;
    }, z.core.$strip>], "op">>;
}, z.core.$strip>>;
/** Every `op` discriminator value present in the contract. */
export declare const PATCH_OP_NAMES: readonly ["add_instance", "remove_instance", "update_instance", "add_link", "remove_link", "add_resource_type", "add_relationship_type"];
//# sourceMappingURL=patch-schema.d.ts.map