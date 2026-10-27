const NODE_ENVIRONMENTS = ['development', 'test', 'production'] as const;

export interface Environment {
  DATABASE_URL: string;
  PORT: number;
  NODE_ENV: (typeof NODE_ENVIRONMENTS)[number];
}

/**
 * Validates environment variables at startup, used by ConfigModule.
 * Throws with every problem listed, so the app does not start with a broken configuration.
 */
export function validateEnvironment(variables: Record<string, unknown>): Environment {
  const errors: string[] = [];

  const databaseUrl = variables.DATABASE_URL;
  if (typeof databaseUrl !== 'string' || databaseUrl === '') {
    errors.push('DATABASE_URL is required');
  } else if (!/^postgres(ql)?:\/\//.test(databaseUrl)) {
    errors.push('DATABASE_URL must be a PostgreSQL connection URL (postgresql://…)');
  }

  const port = Number(variables.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push('PORT must be an integer between 1 and 65535');
  }

  const nodeEnv = variables.NODE_ENV ?? 'development';
  if (!NODE_ENVIRONMENTS.includes(nodeEnv as Environment['NODE_ENV'])) {
    errors.push(`NODE_ENV must be one of: ${NODE_ENVIRONMENTS.join(', ')}`);
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n- ${errors.join('\n- ')}`);
  }

  return {
    DATABASE_URL: databaseUrl as string,
    PORT: port,
    NODE_ENV: nodeEnv as Environment['NODE_ENV'],
  };
}
