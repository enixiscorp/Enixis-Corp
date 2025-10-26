@echo off
echo Copie des fichiers vers public/...

copy index.html public\
copy demande.html public\
copy style.css public\
copy script.js public\
copy request.js public\
copy env.js public\
copy sitemap.xml public\
copy _headers public\

if exist images\ (
    xcopy images public\images\ /E /I /Y
    echo Images copiees
)

echo Tous les fichiers ont ete copies vers public/
pause