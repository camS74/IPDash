param(
    [string]$msg = "Update project"
)
git add .
git commit -m "$msg"
git push origin master 