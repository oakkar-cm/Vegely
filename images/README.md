# Images

All site photography is stored locally in this folder. Images were sourced from
[Unsplash](https://unsplash.com) and downloaded for reliable offline deployment.

## Folder layout

```
images/
├── hero/        # Hero salad bowl, about-page story photo
├── dishes/      # Menu item & special-dish photos
├── team/        # Chef / founder portraits & review avatars
└── icons/       # Favicon / brand marks
```

## Files

| File | Used on |
|---|---|
| `hero/salad-bowl.jpg` | Home hero |
| `hero/fresh-produce.jpg` | About story section |
| `dishes/*.jpg` | Home featured dishes, full menu |
| `team/*.jpg` | About team cards & testimonials |
| `icons/favicon.svg` | All pages (browser tab icon) |

## Notes

- Cart item thumbnails are read from the menu card `<img>` when adding to cart, so they automatically use these local paths.
- If you replace an image, keep the same filename or update the matching `src` in the HTML.
