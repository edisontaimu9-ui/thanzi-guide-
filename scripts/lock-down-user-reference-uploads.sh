#!/data/data/com.termux/files/usr/bin/bash
# ALREADY APPLIED — user_references and reference_chunks are locked down.
# Kept for reference only; do not re-run the bucket-creation step below,
# it will always fail: this Appwrite plan allows exactly one storage
# bucket, and it's already in use (food_images). There is no separate
# reference_files bucket and there will not be one — admin reference
# document uploads now live in food_images instead. See
# scripts/consolidate-media-bucket.sh for that change.
#
# The two collection permission changes below were already applied
# successfully and do not need to be repeated:
#   - user_references: create("label:admin") only
#   - reference_chunks: create("label:admin") only
