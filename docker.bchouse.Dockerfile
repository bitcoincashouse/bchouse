
FROM node:18-alpine as base
  WORKDIR /app
  COPY ./pnpm-lock.yaml ./package.json ./pnpm-workspace.yaml ./.npmrc ./
  COPY ./packages/utils/package.json ./packages/utils/package.json
  COPY ./packages/cashconnect/package.json ./packages/cashconnect/package.json
  COPY ./packages/inngest/package.json ./packages/inngest/package.json
  COPY ./apps/bchouse/package.json ./apps/bchouse/package.json
  RUN npm install -g pnpm

# Setup production node_modules
FROM base as deps
  WORKDIR /app
  COPY --from=base /app/pnpm-lock.yaml /app/package.json /app/pnpm-workspace.yaml /app/.npmrc ./
  COPY --from=base /app/packages/utils/package.json ./packages/utils/package.json
  COPY --from=base /app/packages/cashconnect/package.json ./packages/cashconnect/package.json
  COPY --from=base /app/packages/inngest/package.json ./packages/inngest/package.json
  COPY --from=base /app/apps/bchouse/package.json ./apps/bchouse/package.json
  COPY ./patches ./patches
  RUN pnpm install

FROM base as utils-build
  WORKDIR /app
  COPY --from=deps /app/node_modules /app/node_modules
  COPY ./packages/utils/package.json ./packages/utils/package.json
  COPY ./packages/utils /app/packages/utils
  RUN npm run build --workspace ./packages/utils

FROM base as inngest-build
  WORKDIR /app
  COPY --from=deps /app/node_modules /app/node_modules
  # Inngest has nested node_modules
  COPY --from=deps /app/packages/inngest/node_modules ./packages/inngest/node_modules
  COPY --from=utils-build /app/packages/utils ./node_modules/@bchouse/utils
  COPY ./packages/inngest/package.json ./packages/inngest/package.json
  COPY ./packages/inngest /app/packages/inngest
  RUN npm run build --workspace ./packages/inngest

FROM base as cashconnect-build
  WORKDIR /app
  COPY --from=deps /app/node_modules /app/node_modules
  # CashConnect has nested node_modules
  COPY --from=deps /app/packages/cashconnect/node_modules ./packages/cashconnect/node_modules
  COPY --from=utils-build /app/packages/utils ./node_modules/@bchouse/utils
  COPY ./packages/cashconnect/package.json ./packages/cashconnect/package.json
  COPY ./packages/cashconnect /app/packages/cashconnect
  RUN npm run build --workspace ./packages/cashconnect

FROM base as production-deps
  WORKDIR /app
  ENV NODE_ENV production
  COPY --from=deps /app/node_modules /app/node_modules
  # BCHouse has nested node_modules
  COPY --from=deps /app/apps/bchouse/node_modules ./apps/bchouse/node_modules
  COPY --from=deps /app/pnpm-lock.yaml /app/package.json /app/pnpm-workspace.yaml ./
  COPY --from=deps /app/apps/bchouse/package.json ./apps/bchouse/package.json
  RUN rm -rf ./node_modules/@prisma/engines
  RUN pnpm prune --prod --no-optional

FROM base as build
  WORKDIR /app
  COPY --from=deps /app/node_modules ./node_modules
  RUN npx --workspace @bchouse/site prisma generate
  COPY ./apps/bchouse /app/apps/bchouse
  # BCHouse has nested node_modules
  COPY --from=deps /app/apps/bchouse/node_modules ./apps/bchouse/node_modules
  COPY --from=utils-build /app/packages/utils ./apps/bchouse/node_modules/@bchouse/utils
  COPY --from=cashconnect-build /app/packages/cashconnect ./apps/bchouse/node_modules/@bchouse/cashconnect
  COPY --from=inngest-build /app/packages/inngest ./apps/bchouse/node_modules/@bchouse/inngest
  RUN npm run build --workspace ./apps/bchouse

FROM base
  ENV NODE_ENV production
  WORKDIR /app
  COPY --from=production-deps /app/node_modules /app/node_modules
  # BCHouse has nested node_modules
  COPY --from=production-deps /app/apps/bchouse/node_modules /app/apps/bchouse/node_modules
  COPY --from=utils-build /app/packages/utils ./apps/bchouse/node_modules/@bchouse/utils
  COPY --from=cashconnect-build /app/packages/cashconnect/ ./apps/bchouse/node_modules/@bchouse/cashconnect
  COPY --from=inngest-build /app/packages/inngest/ ./apps/bchouse/node_modules/@bchouse/inngest
  COPY --from=build /app/apps/bchouse/build /app/apps/bchouse/build
  COPY --from=build /app/apps/bchouse/public /app/apps/bchouse/public
  CMD npm run start --workspace ./apps/bchouse
  # CMD tail -f /dev/null