// ─────────────────────────────────────────────────────────────────────────────
// GraphQL Templates — Apollo Server 4 integration
// ─────────────────────────────────────────────────────────────────────────────

/** Generate src/graphql/schema.js */
export function graphqlSchema(options) {
  const { language } = options;
  const isTS = language === 'typescript';

  return `import { gql } from 'graphql-tag';

/**
 * GraphQL Type Definitions
 *
 * Defines the schema for the API including:
 * - User type
 * - Queries  (getUsers, getUserById)
 * - Mutations (createUser, updateUser, deleteUser)
 */
export const typeDefs = gql\`
  type User {
    id:        ID!
    name:      String!
    email:     String!
    role:      String!
    isActive:  Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    user:         User!
    accessToken:  String!
    refreshToken: String!
  }

  type DeleteResult {
    message: String!
  }

  input CreateUserInput {
    name:     String!
    email:    String!
    password: String!
  }

  input UpdateUserInput {
    name:  String
    email: String
  }

  type Query {
    "Get all active users"
    users: [User!]!

    "Get a single user by ID"
    user(id: ID!): User
  }

  type Mutation {
    "Create a new user"
    createUser(input: CreateUserInput!): User!

    "Update an existing user"
    updateUser(id: ID!, input: UpdateUserInput!): User!

    "Delete a user"
    deleteUser(id: ID!): DeleteResult!
  }
\`;
`;
}

/** Generate src/graphql/resolvers.js */
export function graphqlResolvers(options) {
  const { language } = options;
  const isTS = language === 'typescript';

  return `import { UserService } from '../services/user.service.js';
import { ApiError } from '../utils/apiError.js';

/**
 * GraphQL Resolvers
 *
 * Maps GraphQL operations to service layer methods.
 * Errors thrown by services are naturally propagated to Apollo's error handler.
 */
export const resolvers = {
  Query: {
    users: async (_parent${isTS ? ': unknown' : ''}, _args${isTS ? ': unknown' : ''}, _ctx${isTS ? ': unknown' : ''}) => {
      return UserService.getAll();
    },

    user: async (_parent${isTS ? ': unknown' : ''}, args${isTS ? ': { id: string }' : ''}, _ctx${isTS ? ': unknown' : ''}) => {
      return UserService.getById(args.id);
    },
  },

  Mutation: {
    createUser: async (
      _parent${isTS ? ': unknown' : ''},
      args${isTS ? ': { input: { name: string; email: string; password: string } }' : ''},
      _ctx${isTS ? ': unknown' : ''}
    ) => {
      return UserService.create(args.input);
    },

    updateUser: async (
      _parent${isTS ? ': unknown' : ''},
      args${isTS ? ': { id: string; input: { name?: string; email?: string } }' : ''},
      _ctx${isTS ? ': unknown' : ''}
    ) => {
      return UserService.update(args.id, args.input);
    },

    deleteUser: async (_parent${isTS ? ': unknown' : ''}, args${isTS ? ': { id: string }' : ''}, _ctx${isTS ? ': unknown' : ''}) => {
      return UserService.remove(args.id);
    },
  },
};
`;
}

/** Generate src/graphql/server.js */
export function graphqlServer(options) {
  const { language } = options;
  const isTS = language === 'typescript';

  return `import { ApolloServer } from '@apollo/server';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';

/**
 * Creates and returns a configured Apollo Server instance.
 * Mount via expressMiddleware in app.js.
 *
 * @returns {ApolloServer}
 */
export function createApolloServer()${isTS ? ': ApolloServer' : ''} {
  return new ApolloServer({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== 'production',
    formatError: (formattedError${isTS ? ': any' : ''}, error${isTS ? ': unknown' : ''}) => {
      // Mask internal server errors in production
      if (
        process.env.NODE_ENV === 'production' &&
        formattedError.extensions?.code === 'INTERNAL_SERVER_ERROR'
      ) {
        return { message: 'Internal server error' };
      }
      return formattedError;
    },
  });
}
`;
}
