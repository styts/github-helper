var fs = require('fs-extra')
var path = require('path')

// clean de dist folder
fs.emptyDirSync(path.join(__dirname, '../build'))
fs.copySync(path.join(__dirname, '../src/images'),
            path.join(__dirname, '../build/images'))

require('./generate_manifest')
