import path from 'path';
import { execSync } from 'child_process';

const startupFolder = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
const shortcutPath = path.join(startupFolder, 'SanAthanasiusServer.lnk');
const appDir = path.resolve('.');
const exePath = path.join(appDir, 'SanAthanasiusServer.exe');
const iconPath = path.join(appDir, 'app.ico');

// PowerShell command to create the shortcut using WScript.Shell
const psScript = `
$wsh = New-Object -ComObject WScript.Shell
$sc = $wsh.CreateShortcut('${shortcutPath.replace(/'/g, "''")}')
$sc.TargetPath = '${exePath.replace(/'/g, "''")}'
$sc.Arguments = '--startup'
$sc.WorkingDirectory = '${appDir.replace(/'/g, "''")}'
$sc.WindowStyle = 7
$sc.Description = 'San Athanasius Church Members Server'
$sc.IconLocation = '${iconPath.replace(/'/g, "''")},0'
$sc.Save()
`;

const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
execSync(`powershell -NoProfile -EncodedCommand ${encoded}`, { stdio: 'inherit' });

console.log('Startup shortcut created at:', shortcutPath);
