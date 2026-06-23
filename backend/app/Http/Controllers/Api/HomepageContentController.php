<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Throwable;

class HomepageContentController extends Controller
{
    private function publicRoot(): string
    {
        return dirname(base_path()) . '/public_html/dhaka-ladies-club';
    }

    private function homepageDir(): string
    {
        return $this->publicRoot() . '/uploads/homepage';
    }

    private function galleryDir(): string
    {
        return $this->homepageDir() . '/gallery';
    }

    private function contentFile(): string
    {
        return $this->homepageDir() . '/homepage-content.json';
    }

    private function defaultContent(): array
    {
        return [
            'hero' => [
                'title' => 'Elegant Events',
                'highlight' => 'Beautiful Memories',
                'subtitle' => 'Dhaka Ladies Club is a luxurious convention hall offering premium event spaces for weddings, receptions, conferences, and unforgettable celebrations.',
                'background_image' => '/assets/img/BG-01.jpeg',
                'primary_button_text' => 'Book Your Event',
                'primary_button_link' => '#calendar-booking',
                'secondary_button_text' => 'Discover More',
                'secondary_button_link' => '#about',
            ],
            'our_story' => [
                'eyebrow' => 'Our Story',
                'title' => 'About Dhaka Ladies Club',
                'description' => 'A prestigious event destination in Dhaka designed for elegant weddings, corporate events, and premium celebrations.',
            ],
            'creating_experiences' => [
                'image' => '/assets/img/About.jpg',
                'eyebrow' => 'Creating Experiences',
                'title' => 'Where Every Event Becomes Extraordinary',
                'description_1' => 'Dhaka Ladies Club combines elegance, luxury, and professionalism to deliver exceptional event experiences for every guest. Our dedicated team ensures that every detail is meticulously planned and executed.',
                'description_2' => 'From stunning decoration arrangements to premium hospitality, every celebration is carefully designed to create lifelong memories that you and your guests will cherish forever.',
                'points' => [
                    'Premium Decorations',
                    'Expert Catering',
                    'State-of-Art AV',
                    'Valet Parking',
                    'Dedicated Team',
                    'Custom Packages',
                ],
            ],
            'gallery' => [
                'eyebrow' => 'Visual Gallery',
                'title' => 'Decoration Gallery',
                'description' => 'Explore stunning decoration concepts and luxurious setups from our most celebrated events.',
                'images' => [],
            ],
            'footer' => [
                'description' => 'A prestigious event destination in Dhaka delivering exceptional experiences for weddings, corporate events, and premium celebrations since 2005.',
                'address' => 'Dhaka, Bangladesh',
                'phone' => '+880 1700-000000',
                'email' => 'info@dhakaladiesclub.com',
                'copyright' => '© 2026 Dhaka Ladies Club. All Rights Reserved.',
                'tagline' => 'Premium Convention & Party Venue in Dhaka',
            ],
        ];
    }

    private function ensureStorageExists(): void
    {
        if (!File::exists($this->homepageDir())) {
            File::makeDirectory($this->homepageDir(), 0755, true);
        }

        if (!File::exists($this->galleryDir())) {
            File::makeDirectory($this->galleryDir(), 0755, true);
        }

        if (!File::exists($this->contentFile())) {
            $this->writeContent($this->defaultContent());
        }
    }

    private function readContent(): array
    {
        $this->ensureStorageExists();

        $raw = File::get($this->contentFile());
        $decoded = json_decode($raw, true);

        if (!is_array($decoded)) {
            $decoded = [];
        }

        return array_replace_recursive($this->defaultContent(), $decoded);
    }

    private function writeContent(array $content): void
    {
        if (!File::exists($this->homepageDir())) {
            File::makeDirectory($this->homepageDir(), 0755, true);
        }

        File::put(
            $this->contentFile(),
            json_encode($content, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
        );
    }

    public function show(): JsonResponse
    {
        return response()
            ->json([
                'success' => true,
                'message' => 'Homepage content loaded successfully.',
                'data' => $this->readContent(),
            ])
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    }

    public function update(Request $request): JsonResponse
    {
        try {
            $incoming = $request->all();

            $allowedKeys = [
                'hero',
                'our_story',
                'creating_experiences',
                'gallery',
                'footer',
            ];

            $incoming = Arr::only($incoming, $allowedKeys);

            $current = $this->readContent();
            $updated = array_replace_recursive($current, $incoming);

            if (isset($updated['creating_experiences']['points']) && !is_array($updated['creating_experiences']['points'])) {
                $updated['creating_experiences']['points'] = [];
            }

            if (isset($updated['gallery']['images']) && !is_array($updated['gallery']['images'])) {
                $updated['gallery']['images'] = [];
            }

            $this->writeContent($updated);

            return response()->json([
                'success' => true,
                'message' => 'Homepage content updated successfully.',
                'data' => $updated,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update homepage content.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function uploadImage(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'target' => ['required', 'string', 'in:hero_background,creating_experiences_image'],
                'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            ]);

            $this->ensureStorageExists();

            $content = $this->readContent();
            $file = $request->file('image');
            $extension = $file->getClientOriginalExtension();

            $targetMap = [
                'hero_background' => [
                    'json_path' => ['hero', 'background_image'],
                    'filename' => 'hero-background.' . $extension,
                ],
                'creating_experiences_image' => [
                    'json_path' => ['creating_experiences', 'image'],
                    'filename' => 'creating-experiences.' . $extension,
                ],
            ];

            $config = $targetMap[$validated['target']];
            $filename = $config['filename'];
            $absolutePath = $this->homepageDir() . '/' . $filename;
            $publicUrl = '/uploads/homepage/' . $filename;

            $oldUrl = Arr::get($content, implode('.', $config['json_path']));

            $this->deleteUploadedFileByUrl($oldUrl);

            $file->move($this->homepageDir(), $filename);

            Arr::set($content, implode('.', $config['json_path']), $publicUrl);

            $this->writeContent($content);

            return response()->json([
                'success' => true,
                'message' => 'Image uploaded successfully.',
                'image_url' => $publicUrl,
                'data' => $content,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload image.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function storeGalleryImage(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
                'alt' => ['nullable', 'string', 'max:150'],
            ]);

            $this->ensureStorageExists();

            $content = $this->readContent();

            $file = $request->file('image');
            $extension = $file->getClientOriginalExtension();

            $id = 'gallery_' . now()->format('YmdHis') . '_' . Str::lower(Str::random(6));
            $filename = $id . '.' . $extension;

            $file->move($this->galleryDir(), $filename);

            $imageItem = [
                'id' => $id,
                'url' => '/uploads/homepage/gallery/' . $filename,
                'alt' => $validated['alt'] ?? 'Gallery image',
            ];

            $content['gallery']['images'][] = $imageItem;

            $this->writeContent($content);

            return response()->json([
                'success' => true,
                'message' => 'Gallery image uploaded successfully.',
                'image' => $imageItem,
                'data' => $content,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload gallery image.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function deleteGalleryImage(string $imageId): JsonResponse
    {
        try {
            $this->ensureStorageExists();

            $content = $this->readContent();
            $images = $content['gallery']['images'] ?? [];

            $deletedImage = null;

            $remainingImages = array_values(array_filter($images, function ($image) use ($imageId, &$deletedImage) {
                if (($image['id'] ?? null) === $imageId) {
                    $deletedImage = $image;
                    return false;
                }

                return true;
            }));

            if (!$deletedImage) {
                return response()->json([
                    'success' => false,
                    'message' => 'Gallery image not found.',
                ], 404);
            }

            $this->deleteUploadedFileByUrl($deletedImage['url'] ?? null);

            $content['gallery']['images'] = $remainingImages;

            $this->writeContent($content);

            return response()->json([
                'success' => true,
                'message' => 'Gallery image deleted successfully.',
                'data' => $content,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete gallery image.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function deleteUploadedFileByUrl(?string $url): void
    {
        if (!$url || !Str::startsWith($url, '/uploads/homepage/')) {
            return;
        }

        $absolutePath = $this->publicRoot() . $url;

        if (File::exists($absolutePath) && File::isFile($absolutePath)) {
            File::delete($absolutePath);
        }
    }
}