#!/data/data/com.termux/files/usr/bin/bash
# ALREADY APPLIED — kept for reference only, do not re-run.
#
# Originally created a dedicated "reference_documents" bucket for
# admin-uploaded CMS reference files. That failed with
# "additional_resource_not_allowed" (bucket limit reached on the current
# Appwrite plan), so the feature was changed to reuse the existing
# "reference_files" bucket instead — no new bucket needed. See
# src/routes/ContentForm.tsx (handleFileUpload), which uploads there with
# an explicit per-file Permission.read(Role.any()) so admin-uploaded
# documents are public while other users' personal reference uploads
# stay private. That's a code-only change; nothing left to run here.
#
# The two schema changes below were already applied successfully and do
# not need to be repeated:
#   - fileId / fileName string attributes added to the "references" collection
#   - "references" collection create/update permissions locked to label:admin
