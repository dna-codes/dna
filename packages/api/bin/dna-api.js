#!/usr/bin/env node
/* eslint-disable */
const { runCli } = require('../dist/cli')

runCli(process.argv.slice(2), process.env)
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err && err.stack ? err.stack : err)
    process.exit(1)
  })
