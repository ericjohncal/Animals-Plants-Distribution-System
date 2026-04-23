import requests
import sys

def download_image(url, filename):
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/123.0.0.0 Safari/537.36"
        ),
        "Referer": url,
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    }

    try:
        response = requests.get(url, headers=headers, stream=True, timeout=20)
        response.raise_for_status()

        with open(filename, "wb") as file:
            for chunk in response.iter_content(1024):
                if chunk:
                    file.write(chunk)

        print(f"Image saved as {filename}")

    except requests.exceptions.RequestException as e:
        print(f"Error downloading image: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python downloader.py <image_url> [filename]")
        sys.exit(1)

    image_url = sys.argv[1]
    filename = sys.argv[2] if len(sys.argv) > 2 else "image.jpg"

    download_image(image_url, filename)