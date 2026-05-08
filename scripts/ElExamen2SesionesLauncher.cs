using System;
using System.Diagnostics;
using System.IO;
using System.Threading;

internal static class ElExamen2SesionesLauncher
{
    private const int Port = 5173;

    private static int Main()
    {
        string projectDir = AppDomain.CurrentDomain.BaseDirectory;
        string baseUrl = "http://127.0.0.1:" + Port;
        string sessionUrl = baseUrl + "/?screen=access";

        Console.Title = "El Examen 2 - Sesiones locales";
        Console.WriteLine();
        Console.WriteLine("==========================================");
        Console.WriteLine("  El Examen 2 - Sesiones locales");
        Console.WriteLine("==========================================");
        Console.WriteLine();

        if (!File.Exists(Path.Combine(projectDir, "package.json")))
        {
            Console.WriteLine("No encuentro package.json junto a este ejecutable.");
            Console.WriteLine("Deja el .exe en la raiz del proyecto.");
            Pause();
            return 1;
        }

        string npm = FindOnPath("npm.cmd") ?? FindOnPath("npm.exe") ?? FindOnPath("npm");
        if (npm == null)
        {
            Console.WriteLine("No se encontro npm. Instala Node.js o abre este proyecto en un entorno con Node.");
            Pause();
            return 1;
        }

        if (!Directory.Exists(Path.Combine(projectDir, "node_modules")))
        {
            Console.WriteLine("Instalando dependencias...");
            int installCode = RunAndWait(npm, "install", projectDir);
            if (installCode != 0)
            {
                Console.WriteLine("npm install fallo con codigo " + installCode + ".");
                Pause();
                return installCode;
            }
        }

        Console.WriteLine("Arrancando servidor Vite en " + baseUrl + " ...");
        StartServer(projectDir);

        Console.WriteLine("Esperando a que Vite este listo...");
        Thread.Sleep(4000);

        Console.WriteLine("Abriendo 3 pestanas de sesion...");
        OpenUrl(sessionUrl);
        OpenUrl(sessionUrl);
        OpenUrl(sessionUrl);

        Console.WriteLine();
        Console.WriteLine("Listo. Introduce los codigos en las tres pestanas.");
        Console.WriteLine("El servidor queda abierto en una ventana aparte.");
        Pause();
        return 0;
    }

    private static void StartServer(string projectDir)
    {
        var info = new ProcessStartInfo
        {
            FileName = "cmd.exe",
            Arguments = "/k \"cd /d \"\"" + projectDir + "\"\" && npm run dev -- --port " + Port + "\"",
            WorkingDirectory = projectDir,
            UseShellExecute = true,
            WindowStyle = ProcessWindowStyle.Normal
        };
        Process.Start(info);
    }

    private static int RunAndWait(string fileName, string arguments, string workingDirectory)
    {
        var info = new ProcessStartInfo
        {
            FileName = fileName,
            Arguments = arguments,
            WorkingDirectory = workingDirectory,
            UseShellExecute = false
        };
        using (var process = Process.Start(info))
        {
            process.WaitForExit();
            return process.ExitCode;
        }
    }

    private static void OpenUrl(string url)
    {
        Process.Start(new ProcessStartInfo
        {
            FileName = url,
            UseShellExecute = true
        });
    }

    private static string FindOnPath(string fileName)
    {
        string path = Environment.GetEnvironmentVariable("PATH") ?? "";
        foreach (string part in path.Split(Path.PathSeparator))
        {
            if (string.IsNullOrWhiteSpace(part)) continue;
            string candidate = Path.Combine(part.Trim(), fileName);
            if (File.Exists(candidate)) return candidate;
        }
        return null;
    }

    private static void Pause()
    {
        Console.WriteLine();
        Console.WriteLine("Pulsa una tecla para cerrar esta ventana.");
        Console.ReadKey(true);
    }
}
