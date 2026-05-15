CRM user upload files are stored here (not in git).

Path pattern: public/crm-files/users/{userId}/{filename}

If folders were removed by "git clean -fd", re-upload files from Admin:
  Admin → CRM file → Upload for user

The API checks disk at:
  /api/crm/file/info
  /api/admin/crm-file/upload-user
