FROM node:lts-slim AS base
WORKDIR /
COPY . .
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --no-frozen-lockfile

FROM base
COPY --from=prod-deps /node_modules /node_modules
CMD [ "pnpm", "start" ]