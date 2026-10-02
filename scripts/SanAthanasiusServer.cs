using System;
using System.IO;
using System.Diagnostics;
using System.Threading;
using System.Windows.Forms;
using System.Drawing;
using System.Net.Sockets;

namespace SanAthanasius
{
    static class Program
    {
        private const string MutexName = "Global\\SanAthanasiusChurchServerMutex";
        private const string AppTitle = "خادم كنيسة القديس أثناسيوس الرسولي";
        private const string ServerUrl = "http://localhost:3001/";
        private const int ServerPort = 3001;

        [STAThread]
        static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            string startupShortcutPath = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.Startup),
                "SanAthanasiusServer.lnk"
            );

            // Handle CLI arguments
            if (args.Length > 0)
            {
                string arg = args[0].Trim().ToLowerInvariant();

                if (arg == "--install-startup" || arg == "-install" || arg == "/install")
                {
                    bool ok = SetStartup(startupShortcutPath, Application.ExecutablePath, appDir, true);
                    if (ok)
                    {
                        MessageBox.Show("تم تفعيل التشغيل التلقائي بنجاح!\nسيبدأ خادم الكنيسة بالعمل في الخلفية تلقائياً عند تشغيل ويندوز.",
                            AppTitle, MessageBoxButtons.OK, MessageBoxIcon.Information);
                    }
                    else
                    {
                        MessageBox.Show("تعذر إنشاء اختصار بدء التشغيل.", AppTitle, MessageBoxButtons.OK, MessageBoxIcon.Warning);
                    }
                    return;
                }

                if (arg == "--uninstall-startup" || arg == "-uninstall" || arg == "/uninstall")
                {
                    SetStartup(startupShortcutPath, Application.ExecutablePath, appDir, false);
                    MessageBox.Show("تم إلغاء التشغيل التلقائي عند بدء تشغيل ويندوز.",
                        AppTitle, MessageBoxButtons.OK, MessageBoxIcon.Information);
                    return;
                }

                if (arg == "--stop" || arg == "-stop" || arg == "/stop")
                {
                    StopRunningServer(appDir);
                    MessageBox.Show("تم إيقاف تشغيل الخادم بنجاح.", AppTitle, MessageBoxButtons.OK, MessageBoxIcon.Information);
                    return;
                }

                if (arg == "--status" || arg == "-status")
                {
                    bool isListening = IsPortListening(ServerPort) || IsPortListening(3000);
                    MessageBox.Show(isListening
                        ? "الخادم يعمل بنجاح في الخلفية على الرابط:\n" + ServerUrl
                        : "الخادم غير مشغل حالياً.",
                        AppTitle, MessageBoxButtons.OK, isListening ? MessageBoxIcon.Information : MessageBoxIcon.Warning);
                    return;
                }
            }

            // Single instance check using named Mutex
            bool createdNew;
            using (Mutex mutex = new Mutex(true, MutexName, out createdNew))
            {
                bool isPortActive = IsPortListening(ServerPort) || IsPortListening(3000);

                if (!createdNew || isPortActive)
                {
                    // Already running!
                    bool isSilent = args.Length > 0 && (args[0] == "--silent" || args[0] == "--startup");
                    if (!isSilent)
                    {
                        OpenUrlInBrowser(ServerUrl);
                    }
                    return;
                }

                // Automatically ensure Startup shortcut exists
                if (!File.Exists(startupShortcutPath))
                {
                    try
                    {
                        SetStartup(startupShortcutPath, Application.ExecutablePath, appDir, true);
                    }
                    catch { }
                }

                // Locate node.exe
                string nodeExe = FindNodeExecutable(appDir);
                if (string.IsNullOrEmpty(nodeExe) || !File.Exists(nodeExe))
                {
                    MessageBox.Show("لم يتم العثور على Node.js في هذا الجهاز.\nيرجى التأكد من تثبيت Node.js لتشغيل الخادم.",
                        AppTitle, MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                // Launch server.js in background
                Process nodeProcess = StartNodeProcess(nodeExe, appDir);
                if (nodeProcess == null)
                {
                    MessageBox.Show("حدث خطأ أثناء تشغيل خادم البيانات.", AppTitle, MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }

                // If not launched at boot (--startup / --silent), open browser and notify user
                bool isStartupLaunch = args.Length > 0 && (args[0] == "--silent" || args[0] == "--startup");
                if (!isStartupLaunch)
                {
                    ThreadPool.QueueUserWorkItem(_ =>
                    {
                        Thread.Sleep(700);
                        OpenUrlInBrowser(ServerUrl);
                    });
                }

                // Run Tray App Context (runs quietly in system tray)
                Application.Run(new ServerApplicationContext(nodeProcess, nodeExe, appDir, startupShortcutPath, !isStartupLaunch));
            }
        }

        private static string FindNodeExecutable(string appDir)
        {
            // 1. Local folder node.exe
            string localNode = Path.Combine(appDir, "node.exe");
            if (File.Exists(localNode)) return localNode;

            // 2. Known NVM / Node.js paths
            string[] knownPaths = new string[]
            {
                @"C:\nvm4w\nodejs\node.exe",
                @"C:\Program Files\nodejs\node.exe",
                @"C:\Program Files (x86)\nodejs\node.exe",
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Programs\node\node.exe")
            };

            foreach (string p in knownPaths)
            {
                if (File.Exists(p)) return p;
            }

            // 3. Search in system PATH
            string pathEnv = Environment.GetEnvironmentVariable("PATH");
            if (!string.IsNullOrEmpty(pathEnv))
            {
                string[] dirs = pathEnv.Split(';');
                foreach (string d in dirs)
                {
                    try
                    {
                        string candidate = Path.Combine(d.Trim(), "node.exe");
                        if (File.Exists(candidate)) return candidate;
                    }
                    catch { }
                }
            }

            return null;
        }

        public static Process StartNodeProcess(string nodeExe, string appDir)
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = nodeExe,
                    Arguments = "server.js",
                    WorkingDirectory = appDir,
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    WindowStyle = ProcessWindowStyle.Hidden
                };

                return Process.Start(psi);
            }
            catch (Exception ex)
            {
                Debug.WriteLine("Error starting node: " + ex.Message);
                return null;
            }
        }

        public static void OpenUrlInBrowser(string url)
        {
            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = url,
                    UseShellExecute = true
                });
            }
            catch { }
        }

        public static bool IsPortListening(int port)
        {
            try
            {
                using (TcpClient client = new TcpClient())
                {
                    IAsyncResult ar = client.BeginConnect("127.0.0.1", port, null, null);
                    bool success = ar.AsyncWaitHandle.WaitOne(300);
                    if (success && client.Connected)
                    {
                        client.EndConnect(ar);
                        return true;
                    }
                }
            }
            catch { }
            return false;
        }

        public static void StopRunningServer(string appDir)
        {
            try
            {
                // Kill any node processes running server.js in this directory
                Process[] procs = Process.GetProcessesByName("node");
                foreach (Process p in procs)
                {
                    try
                    {
                        p.Kill();
                    }
                    catch { }
                }
            }
            catch { }
        }

        public static bool SetStartup(string shortcutPath, string exePath, string appDir, bool enable)
        {
            try
            {
                if (!enable)
                {
                    if (File.Exists(shortcutPath)) File.Delete(shortcutPath);
                    return true;
                }

                Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                if (shellType == null) return false;

                dynamic shell = Activator.CreateInstance(shellType);
                dynamic shortcut = shell.CreateShortcut(shortcutPath);
                shortcut.TargetPath = exePath;
                shortcut.Arguments = "--startup";
                shortcut.WorkingDirectory = appDir;
                shortcut.WindowStyle = 7; // Minimized
                shortcut.Description = "خادم كنيسة القديس أثناسيوس الرسولي";

                string iconPath = Path.Combine(appDir, "app.ico");
                if (File.Exists(iconPath))
                {
                    shortcut.IconLocation = iconPath + ",0";
                }

                shortcut.Save();
                return true;
            }
            catch
            {
                return false;
            }
        }
    }

    public class ServerApplicationContext : ApplicationContext
    {
        private Process _nodeProcess;
        private readonly string _nodeExe;
        private readonly string _appDir;
        private readonly string _shortcutPath;
        private readonly NotifyIcon _trayIcon;
        private readonly ContextMenuStrip _contextMenu;
        private readonly ToolStripMenuItem _startupMenuItem;

        public ServerApplicationContext(Process nodeProcess, string nodeExe, string appDir, string shortcutPath, bool showWelcome)
        {
            _nodeProcess = nodeProcess;
            _nodeExe = nodeExe;
            _appDir = appDir;
            _shortcutPath = shortcutPath;

            // Load custom Icon or fallback
            Icon appIcon = null;
            string iconPath = Path.Combine(appDir, "app.ico");
            if (File.Exists(iconPath))
            {
                try { appIcon = new Icon(iconPath); } catch { }
            }
            if (appIcon == null)
            {
                appIcon = SystemIcons.Application;
            }

            // Context Menu
            _contextMenu = new ContextMenuStrip();
            _contextMenu.RightToLeft = RightToLeft.Yes;

            // 1. Open Web App
            var openItem = new ToolStripMenuItem("فتح التطبيق في المتصفح");
            openItem.Font = new Font(_contextMenu.Font, FontStyle.Bold);
            openItem.Click += (s, e) => Program.OpenUrlInBrowser("http://localhost:3001/");
            _contextMenu.Items.Add(openItem);

            // 2. Link Info
            var copyItem = new ToolStripMenuItem("نسخ رابط التطبيق (http://localhost:3001)");
            copyItem.Click += (s, e) =>
            {
                Clipboard.SetText("http://localhost:3001/");
                _trayIcon.ShowBalloonTip(2000, "تم النسخ", "تم نسخ الرابط http://localhost:3001 للحافظة.", ToolTipIcon.Info);
            };
            _contextMenu.Items.Add(copyItem);

            _contextMenu.Items.Add(new ToolStripSeparator());

            // 3. Run at Startup Toggle
            _startupMenuItem = new ToolStripMenuItem("تشغيل تلقائي مع إقلاع ويندوز");
            _startupMenuItem.CheckOnClick = true;
            _startupMenuItem.Checked = File.Exists(_shortcutPath);
            _startupMenuItem.Click += (s, e) =>
            {
                bool newState = _startupMenuItem.Checked;
                Program.SetStartup(_shortcutPath, Application.ExecutablePath, _appDir, newState);
                _trayIcon.ShowBalloonTip(2500, "بدء التشغيل مع ويندوز",
                    newState ? "تم تفعيل التشغيل التلقائي مع إقلاع الجهاز بنجاح." : "تم إلغاء التشغيل التلقائي مع إقلاع الجهاز.",
                    ToolTipIcon.Info);
            };
            _contextMenu.Items.Add(_startupMenuItem);

            // 4. Restart Server
            var restartItem = new ToolStripMenuItem("إعادة تشغيل الخادم");
            restartItem.Click += (s, e) => RestartServer();
            _contextMenu.Items.Add(restartItem);

            _contextMenu.Items.Add(new ToolStripSeparator());

            // 5. Exit
            var exitItem = new ToolStripMenuItem("إيقاف الخادم والخروج");
            exitItem.Click += (s, e) => ExitApplication();
            _contextMenu.Items.Add(exitItem);

            // Tray Icon
            _trayIcon = new NotifyIcon
            {
                Icon = appIcon,
                ContextMenuStrip = _contextMenu,
                Text = "خادم كنيسة القديس أثناسيوس (3001)",
                Visible = true
            };

            _trayIcon.DoubleClick += (s, e) => Program.OpenUrlInBrowser("http://localhost:3001/");

            if (showWelcome)
            {
                _trayIcon.ShowBalloonTip(3500,
                    "خادم كنيسة القديس أثناسيوس قيد التشغيل",
                    "يعمل الخادم بنجاح في الخلفية على الرابط:\nhttp://localhost:3001\nوتم ضبطه للعمل تلقائياً مع بدء تشغيل الجهاز.",
                    ToolTipIcon.Info);
            }

            // Cleanup on application exit
            Application.ApplicationExit += (s, e) => KillNode();
            AppDomain.CurrentDomain.ProcessExit += (s, e) => KillNode();
        }

        private void RestartServer()
        {
            KillNode();
            Thread.Sleep(500);
            _nodeProcess = Program.StartNodeProcess(_nodeExe, _appDir);
            _trayIcon.ShowBalloonTip(2000, "إعادة تشغيل الخادم", "تمت إعادة تشغيل خادم البيانات بنجاح.", ToolTipIcon.Info);
        }

        private void KillNode()
        {
            try
            {
                if (_nodeProcess != null && !_nodeProcess.HasExited)
                {
                    _nodeProcess.Kill();
                    _nodeProcess = null;
                }
            }
            catch { }
        }

        private void ExitApplication()
        {
            KillNode();
            if (_trayIcon != null)
            {
                _trayIcon.Visible = false;
                _trayIcon.Dispose();
            }
            Application.Exit();
        }
    }
}
