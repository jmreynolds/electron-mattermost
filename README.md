This is strictly my personal fork of the [official repo](https://github.com/yuya-oc/electron-mattermost)

I'm changing a few minor details - and noone should be under any expectation that I'm keeping this fork completely current with the main branch. That said, if you want to play with it, I haven't changed any of the significant details yet - so here's the usage and config instructions.

Have fun!


## Usage

### Installation
Detailed guides are available at [docs/setup.md](docs/setup.md).

1. Download and unarchive a file from [release page](http://github.com/yuya-oc/electron-mattermost/releases).
2. Launch `electron-mattermost` in the unarchived folder.
3. After first launching, please input name and URL for your Mattermost team. For example, `myteam : http://mattermost.example.com/team`.

### Quit
Ctrl or Command + Q to quit.

### Configuration
You can show the dialog from menu bar.
(On Windows, please press Alt key to show the menu bar.)

Configuration will be saved into Electron's userData directory:
* `%APPDATA%\electron-mattermost` on Windows
* `~/Library/Application Support/electron-mattermost` on OS X
* `~/.config/electron-mattermost` on Linux


## Testing and Development
Node.js is required to test this app.

### Simple testing
1. Clone or download the source code.
2. Run `npm install`.
3. Run `npm start`.

When you edit `src/**` files, please execute `npm run build` before `npm start`.

### Development
#### `npm run watch`
Reload the app automatically when you have saved source codes.

#### `npm test`
Run tests with Mocha.

## Packaging
You can package this app with following commands. Packages will be created in `release` directory.

```
$ npm run package (for your platform)
$ npm run package:windows (Requires Windows or Wine)
$ npm run package:osx (Requires OS X or Linux)
$ npm run package:linux
$ npm run package:all (Packages for all platform)
```
