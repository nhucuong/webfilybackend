const fs = require("fs");
const path = require("path");
const archiver = require("archiver");
const { exec } = require("child_process");
const { PurgeCSS } = require("purgecss");
const sectionScripts = require("../exportzip/index");
// =========================
// ZIP GENERATE FUNCTION
// =========================
const universalHeaderScript = `
  document.addEventListener("DOMContentLoaded", function () {
  const headers = document.querySelectorAll("header");

  headers.forEach((header) => {

    const button = header.querySelector("button");
    const mobileMenu = header.querySelector("#mobileMenu");
    const menuIcon = header.querySelector("#menuIcon");
    const closeIcon = header.querySelector("#closeIcon");

    if (!button || !mobileMenu || !menuIcon || !closeIcon) return;

    button.addEventListener("click", () => {

      const isOpen = !mobileMenu.classList.contains("hidden");

      mobileMenu.classList.toggle("hidden");
      menuIcon.classList.toggle("hidden", !isOpen);
      closeIcon.classList.toggle("hidden", isOpen);

    });
  });
   });`



function generateIndexJsFromResponse(response) {
  let scripts = [];

  response.forEach(page => {
    if (page.sections && Array.isArray(page.sections)) {
      page.sections.forEach(section => {
        const key = `${section.type}_${section.variant}`;
        if (sectionScripts[key]) {
          scripts.push(sectionScripts[key]);
        }
      });
    }
  });

  return scripts.join("\n\n");
}

// =========================
// COPY FOLDER FUNCTION
// =========================

function copyFolderRecursiveSync(source, target) {
    if (!fs.existsSync(source)) return;

    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }

    const files = fs.readdirSync(source);

    files.forEach(file => {
        const sourcePath = path.join(source, file);
        const targetPath = path.join(target, file);

        if (fs.lstatSync(sourcePath).isDirectory()) {
            copyFolderRecursiveSync(sourcePath, targetPath);
        } else {
            fs.copyFileSync(sourcePath, targetPath);
        }
    });
}

//Tailwind Build Function
function buildTailwind(tempDir) {
    return new Promise((resolve, reject) => {
        const inputPath = path.join(process.cwd(), "exportzip", "src", "styles", "input.css");
        const outputPath = path.join(tempDir, "css", "index.css");

        const tailwindCli = path.join(
            process.cwd(),
            "node_modules",
            ".bin",
            process.platform === "win32" ? "tailwindcss.cmd" : "tailwindcss"
        );

        const contentPath = `${tempDir.replace(/\\/g, "/")}/**/*.html`;

        const configPath = path.join(process.cwd(), "tailwind.config.js");

        const command = `"${tailwindCli}" -c "${configPath}" -i "${inputPath}" -o "${outputPath}" --content "${contentPath}" --minify`;

        exec(command, { shell: true }, (error, stdout, stderr) => {

            if (stdout) console.log("TAILWIND STDOUT:", stdout);
            if (stderr) console.log("TAILWIND STDERR:", stderr);

            if (error) return reject(error);

            resolve();
        });
    });
}



async function cleanCSS(tempDir) {
  const result = await new PurgeCSS().purge({
    content: [`${tempDir}/**/*.html`],
    css: [`${tempDir}/css/style.css`],
    safelist: {
      standard: [
        "show",
        "open",
        "active",
        "hidden"
      ]
    }
  });

  if (!result || result.length === 0) {
    console.warn("PurgeCSS returned no result.");
    return fs.readFileSync(
      path.join(tempDir, "css", "style.css"),
      "utf8"
    );
  }

  return result[0].css || "";
}
const generateWebsiteZip = async ({ pages, css, animations, fileName, fontName,response,favicon,preferenceId,designStyle,seodetails  }) => {
    return new Promise(async (resolve, reject) => {
        try {
           const zipRootFolder = path.join(process.cwd(), "uploads", "websites","exports");
            if (!fs.existsSync(zipRootFolder)) {
                fs.mkdirSync(zipRootFolder, { recursive: true });
            }

             const tempDir = path.join(zipRootFolder, fileName);  
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const cssDir = path.join(tempDir, "css");

            const jsDir = path.join(tempDir, "js");

             const fontDir = path.join(tempDir, "fonts");

              const imgDir = path.join(tempDir, "img"); 


               [cssDir, jsDir, fontDir,imgDir].forEach(folder => {
                if (!fs.existsSync(folder)) {
                    fs.mkdirSync(folder, { recursive: true });
                }
            });

            const zipPath = path.join(zipRootFolder, `${fileName}.zip`);

            // =========================
            // ADDED: scroll.js create
            // =========================
            fs.writeFileSync(
                path.join(jsDir, "scroll.js"),
                `
document.addEventListener("DOMContentLoaded", function () {
  function initScrollAnimations() {
    const elements = document.querySelectorAll(".scroll-animation");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("scroll-show");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
      }
    );

    elements.forEach((el) => observer.observe(el));
  }

  initScrollAnimations();
});
`.trim());

const sectionScriptsContent = generateIndexJsFromResponse(response);

const finalIndexJs = `
${universalHeaderScript}
${sectionScriptsContent}`;
fs.writeFileSync(path.join(jsDir, "index.js"), finalIndexJs);
const domain = "https://your-domain.com";
let xml = `<?xml version="1.0" encoding="UTF-8"?> 
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
            // HTML File
            if (Array.isArray(pages) && pages.length > 0) {
                pages.forEach(page => {
                    const fullHTML = `
<!DOCTYPE html>
<html lang="en" class="website-theme" >
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${seodetails?.name}</title>
<meta name="description" content="${seodetails?.name}">
<meta name="keywords" content="${seodetails?.keywords}">
<meta name="author" content="${seodetails?.name}">
<meta name="robots" content="index, follow">

<link rel="stylesheet" href="css/index.css">
<link rel="stylesheet" href="css/style.css">
<link rel="stylesheet" href="css/animations.css">
<link rel="icon" type="image/png" href="${favicon}" />
</head>
<body data-design-style="${designStyle}">
${page.html || ""}
<script src="js/scroll.js"></script>
<script src="js/index.js"></script>
</body>
</html>
      `;

                    fs.writeFileSync(path.join(tempDir, page.fileName), fullHTML);

 var pageurl = page.fileName === "home"  ? domain   : `${domain}/${page.fileName}`;
 xml += `
<url>
<loc>${pageurl}</loc>
</url>
`;

                });
            } else {
                fs.writeFileSync(path.join(tempDir, "index.html"), "<h1>No Pages Found</h1>");
            }
xml += `</urlset>`;

            fs.writeFileSync(path.join(cssDir, "style.css"), "");
            fs.writeFileSync(path.join(tempDir, "sitemap.xml"), xml);

            let robotstxt = `User-agent: *

Allow: /

Sitemap: https://${domain}/sitemap.xml`;
            fs.writeFileSync(path.join(tempDir, "robots.txt"), robotstxt);



                const fullHTMLnotFound = `
<!DOCTYPE html>
<html lang="en" class="website-theme" >
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>404 - Page Not Found</title>
<meta name="description" content="${seodetails?.name}">
<meta name="keywords" content="${seodetails?.keywords}">
<meta name="author" content="${seodetails?.name}">
<meta name="robots" content="index, follow">

<link rel="stylesheet" href="css/index.css">
<link rel="stylesheet" href="css/style.css">
<link rel="stylesheet" href="css/animations.css">
<link rel="icon" type="image/png" href="${favicon}" />
</head>
<body data-design-style="${designStyle}" class="bg-gray-50">
<div class="min-h-screen flex items-center justify-center px-6">

    <div class="max-w-2xl text-center">

        <!-- 404 -->
        <div class="text-8xl md:text-9xl font-black text-primary">
            404
        </div>

        <!-- Title -->
        <h1 class="mt-6 text-4xl font-bold text-gray-900">
            Oops! Page Not Found
        </h1>

        <!-- Description -->
        <p class="mt-5 text-lg text-gray-600 leading-8">
            The page you're looking for doesn't exist,
            may have been moved, or the URL might be incorrect.
        </p>

        <!-- Buttons -->
        <div class="mt-10 flex flex-col sm:flex-row justify-center gap-4">

            <a
                href="/"
                class="inline-flex items-center justify-center gap-2 whitespace-nowrap theme-button text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive cursor-pointer bg-primary gradient-primary text-white hover:bg-primary/90 border-transparent h-9 px-6 py-2 has-[>svg]:px-3 group [--btn-shadow:var(--white)] dark:[--btn-shadow:var(--black)]"
            >
                Back to Home
            </a>
        </div>

    </div>

</div>
</body>
</html>
      `;

                    fs.writeFileSync(path.join(tempDir, "404.html"), fullHTMLnotFound);

            if (css) {
                const fixedCSS = css.replace(
                    /(\.\.\/\.\.\/assets\/fonts\/)/g,
                    `../fonts/${fontName}/`
                );

                fs.appendFileSync(path.join(cssDir, "style.css"), `\n\n${fixedCSS}`);
            }

            

            const cleanedCSS = await cleanCSS(tempDir);

fs.writeFileSync(path.join(cssDir, "style.css"), cleanedCSS);
            await buildTailwind(tempDir);

            // Animations CSS File
            fs.writeFileSync(path.join(cssDir, "animations.css"), animations || "");

            // =========================
            // Preference fontName copy
            // =========================

            const allFontsFolder = path.join(process.cwd(), "exportzip", "fonts");

            // preference se jo fontName aaya
            const requestedFontFolder = path.join(allFontsFolder, fontName);

            // zip ke andar destination
            const zipFontFolder = path.join(tempDir, "fonts", fontName);


            if (fs.existsSync(requestedFontFolder)) {
                copyFolderRecursiveSync(requestedFontFolder, zipFontFolder);
               
            } else {
              
            }

            // Create ZIP
            const output = fs.createWriteStream(zipPath);
            const archive = archiver("zip", { zlib: { level: 9 } });

            output.on("close", () => {
                resolve(zipPath);
            });

            archive.on("error", (err) => {
                reject(err);
            });

            archive.pipe(output);
            archive.directory(tempDir, false);
            archive.finalize();
        } catch (err) {
            reject(err);
        }
    });
};

module.exports = {
    generateWebsiteZip
}