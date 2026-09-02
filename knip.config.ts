export default {
  $schema: 'https://unpkg.com/knip@5/schema.json',
  project: ['**/*.ts', '**/*.tsx'],
  ignore: ['**/*.spec.ts', '**/*.spec.tsx', 'lib/constants/stargate-nft.ts', '.claude/**'],
  ignoreBinaries: ['dotenv'],
}
