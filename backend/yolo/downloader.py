import requests
import sys

def download_image(url, filename):
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()

        with open(filename, "wb") as file:
            for chunk in response.iter_content(1024):
                file.write(chunk)
        print(f"Image saved as {filename}")

    except requests.exceptions.RequestException as e:
        print(f"Error downloading image: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python downloader.py <image_url> [filename]")
        sys.exit(1)

    image_url = sys.argv[1]
    filename = sys.argv[2] if len(sys.argv) > 2 else "imgdown.jpg"

    download_image(image_url, filename)