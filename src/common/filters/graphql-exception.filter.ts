import { Catch, HttpException } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

@Catch()
export class GraphqlExceptionFilter implements GqlExceptionFilter {
  catch(exception: unknown): GraphQLError {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      const isObject = typeof response === 'object' && response !== null;
      const messageRaw =
        isObject && 'message' in response
          ? (response as Record<string, unknown>).message
          : response;
      const message = Array.isArray(messageRaw)
        ? messageRaw.join(', ')
        : (messageRaw as string);

      const code =
        isObject && 'code' in response
          ? (response as Record<string, unknown>).code
          : this.getCode(status);

      return new GraphQLError(message, {
        extensions: {
          code,
          message,
          httpCode: status,
        },
      });
    }

    if (exception instanceof GraphQLError) {
      return exception;
    }

    return new GraphQLError('Internal server error', {
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        httpCode: 500,
      },
    });
  }

  private getCode(status: number): string {
    const codes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      500: 'INTERNAL_SERVER_ERROR',
    };
    return codes[status] ?? 'INTERNAL_SERVER_ERROR';
  }
}
