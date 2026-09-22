import os, shutil, subprocess
for f in ['build_data.py','build_theme.py','build_career.py']:
    subprocess.check_call(['python3', f])
# Keep the Netlify deploy copy in sync with every build, so it's never a manual step someone forgets.
os.makedirs('public', exist_ok=True)
shutil.copyfile('run-the-rivalry.html', 'public/index.html')
print('synced public/index.html')
