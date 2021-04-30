const Babel = require('@babel/core');
const chalk = require('chalk');
const fs = require('fs-extra');
const glob = require('glob');
const gzipSize = require('gzip-size');
const path = require('path');
const Table = require('cli-table3');
const { minify } = require('terser');
const webpack = require('webpack');

const { findGitRoot } = require('@fluentui/scripts/monorepo');

// ---

const argv = require('yargs').option('verbose', {
  alias: 'v',
  type: 'boolean',
  description: 'Run with verbose logging',
}).argv;

// ---

const Ajv = require('ajv');
const ajv = new Ajv();

const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    threshold: { type: ['number', 'null'] },
  },
  required: ['name', 'threshold'],
  additionalProperties: false,
};

function createWebpackConfig(fixturePath, outputPath) {
  return {
    name: 'client',
    target: 'web',
    mode: 'production',

    cache: {
      type: 'memory',
    },
    externals: {
      react: 'react',
      'react-dom': 'reactDOM',
    },

    entry: fixturePath,
    output: {
      filename: path.basename(outputPath),
      path: path.dirname(outputPath),

      pathinfo: true,
    },
    performance: {
      hints: false,
    },
    optimization: {
      minimize: false,
    },
    stats: {
      optimizationBailout: true,
    },
  };
}

function webpackAsync(webpackConfig) {
  return new Promise((resolve, reject) => {
    const compiler = webpack(webpackConfig);

    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      }

      const info = stats.toJson();

      if (stats.hasErrors()) {
        reject(info.errors);
      }
      if (stats.hasWarnings()) {
        reject(info.warnings);
      }

      resolve(info);
    });
  });
}

function hrToSeconds(hrtime) {
  let raw = hrtime[0] + hrtime[1] / 1e9;
  return raw.toFixed(2) + 's';
}

function bytesToKb(input) {
  return (input / 1024).toFixed(2) + ' KB';
}

/**
 * @param {{ path: string, name: string, threshold: null | number }} preparedFixture
 */
async function processFixture(preparedFixture) {
  const buildStartTime = process.hrtime();

  const webpackOutputPath = preparedFixture.path.replace(/.fixture.js$/, '.output.js');
  const config = createWebpackConfig(preparedFixture.path, webpackOutputPath);

  await webpackAsync(config);

  if (argv.verbose) {
    console.log(
      chalk.green(
        `✔ Webpack built "${path.basename(preparedFixture.path)}" in ${hrToSeconds(process.hrtime(buildStartTime))}`,
      ),
    );
  }

  // ---

  const terserStartTime = process.hrtime();
  const terserOutputPath = preparedFixture.path.replace(/.fixture.js$/, '.min.js');

  const webpackOutput = (await fs.promises.readFile(webpackOutputPath)).toString();

  const [terserOutput, terserOutputMinified] = await Promise.all([
    // Performs only dead-code elimination
    minify(webpackOutput, {
      mangle: false,
      output: {
        beautify: true,
        comments: true,
        preserve_annotations: true,
      },
    }),
    minify(webpackOutput, {
      output: {
        comments: false,
      },
    }),
  ]);

  await fs.promises.writeFile(webpackOutputPath, terserOutput.code);
  await fs.promises.writeFile(terserOutputPath, terserOutputMinified.code);

  if (argv.verbose) {
    console.log(
      chalk.green(
        `✔ Terser minified "${path.basename(preparedFixture.path)}" in ${hrToSeconds(process.hrtime(terserStartTime))}`,
      ),
    );
  }

  const minifiedSize = bytesToKb((await fs.promises.stat(terserOutputPath)).size);
  const gzippedSize = bytesToKb(await gzipSize.file(terserOutputPath));

  return {
    ...preparedFixture,

    minifiedSize,
    gzippedSize,
  };
}

/**
 * @param {String} fixture
 */
async function prepareFixture(fixture) {
  const sourceFixturePath = path.resolve(findGitRoot(), 'packages', fixture);
  const sourceFixtureCode = await fs.promises.readFile(sourceFixturePath);

  const result = await Babel.transformAsync(sourceFixtureCode.toString(), {
    ast: false,
    code: true,

    babelrc: false,
    plugins: [
      {
        visitor: {
          ExportDefaultDeclaration(path, state) {
            const result = path.get('declaration').evaluate();

            if (!result.confident) {
              throw new Error();
            }

            const valid = ajv.validate(schema, result.value);
            if (!valid) {
              console.log(ajv.errors);
              throw new Error();
            }

            state.file.metadata = result.value;
            path.remove();
          },
        },
      },
    ],
  });

  const outputFixturePath = path.resolve(__dirname, 'dist', fixture);
  await fs.outputFile(outputFixturePath, result.code);

  return {
    path: outputFixturePath,
    ...result.metadata,
  };
}

async function build() {
  const startTime = process.hrtime();

  await fs.remove(path.resolve(__dirname, 'dist'));

  if (argv.verbose) {
    console.log(chalk.blue('✔ Dist is cleared'));
  }

  const fixtures = glob.sync('*/bundle-size/*.fixture.js', {
    cwd: path.resolve(findGitRoot(), 'packages'),
  });
  console.log(chalk.green(`Measuring bundle size for ${fixtures.length} fixtures...`));

  if (argv.verbose) {
    console.log(chalk.blue(fixtures.map(fixture => `  - ${fixture}`).join('\n')));
  }

  const preparedFixtures = await Promise.all(fixtures.map(prepareFixture));
  const measurements = await Promise.all(preparedFixtures.map(processFixture));

  measurements.sort((a, b) => a.path.localeCompare(b.path));

  const table = new Table({
    head: ['Fixture', 'Minified size', 'GZIP size'],
  });

  measurements.forEach(r => {
    table.push([r.name, r.minifiedSize, r.gzippedSize]);
  });

  console.log(table.toString());
  console.log(chalk.green(`✔ Completed in ${hrToSeconds(process.hrtime(startTime))}`));
}

build()
  .then()
  .catch(e => console.log(e));
