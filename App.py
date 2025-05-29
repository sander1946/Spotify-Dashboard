from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:3000", "https://dash.sander1946.com", "https://accounts.spotify.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (css, js, images, icons, etc.)
app.mount("/js", StaticFiles(directory="dist/public/js"), name="js")
app.mount("/css", StaticFiles(directory="src/public/css"), name="css")
app.mount("/img", StaticFiles(directory="src/public/img"), name="img")

# Serve manifest and favicon
@app.get("/manifest.webmanifest")
def manifest():
    return FileResponse("manifest.webmanifest", media_type="application/manifest+json")

@app.get("/robots.txt")
def robots():
    return FileResponse("robots.txt", media_type="text/plain")

@app.get("/favicon.ico")
def favicon():
    return FileResponse("src/public/img/icons/favicon.ico", media_type="image/x-icon")

# Serve root as app.html
@app.get("/")
def root():
    return FileResponse("src/pages/app.html", media_type="text/html")

# Serve 404 page for unknown routes
@app.get("/{full_path}")
def catch_all(full_path: str):
    # TODO: remove this line when the app is ready for production
    # This is just for development purposes to avoid 404 errors, we want to sereve without the file extension
    if not full_path.endswith(".html"):
        full_path = full_path + ".html"
    # Check if the requested path is a valid file in the pages directory
    check_path = os.path.join("src", "pages", full_path)
    if os.path.exists(check_path):
        return FileResponse(check_path, media_type="text/html")
    
    # If the requested path does not exist, serve the 404 page
    not_found_path = os.path.join("src", "pages", "404.html")
    if os.path.exists(not_found_path):
        return FileResponse(not_found_path, media_type="text/html", status_code=404)

    # If 404 page does not exist, return a simple JSON response
    return {"detail": "Not Found"}
