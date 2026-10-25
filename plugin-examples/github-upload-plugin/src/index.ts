import {
  NodeBase,
  NodeConfig,
  NodeInput,
  NodeReturn,
} from "core-package-mini-n8n";

const GITHUB_API = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";

type GitHubResponse = {
  response: Response;
  data: any;
};

function extensionForMimeType(mimeType: string): string {
  const knownExtensions: Record<string, string> = {
    "application/json": "json",
    "application/msword": "doc",
    "application/octet-stream": "bin",
    "application/pdf": "pdf",
    "application/rtf": "rtf",
    "application/zip": "zip",
    "application/xml": "xml",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/x-7z-compressed": "7z",
    "application/x-rar-compressed": "rar",
    "application/x-tar": "tar",
    "application/gzip": "gz",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
    "image/gif": "gif",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/svg+xml": "svg",
    "image/tiff": "tif",
    "image/webp": "webp",
    "text/css": "css",
    "text/csv": "csv",
    "text/html": "html",
    "text/markdown": "md",
    "text/plain": "txt",
    "text/javascript": "js",
    "video/mp4": "mp4",
  };

  const normalizedMimeType = mimeType.toLowerCase().split(";")[0]?.trim() ?? "";
  if (knownExtensions[normalizedMimeType]) {
    return knownExtensions[normalizedMimeType];
  }

  const subtype = normalizedMimeType.split("/")[1]?.trim() ?? "";
  const structuredSuffix = subtype.match(/\+([a-z0-9]+)$/)?.[1];
  const extension = (structuredSuffix ?? subtype.replace(/^x-/, ""))
    .replace(/^vnd\./, "")
    .replace(/[^a-z0-9]+/g, "");

  return extension || "bin";
}

function parseBase64DataUrl(dataUrl: string): { content: string; extension: string } {
  if (!dataUrl.startsWith("data:")) {
    throw new Error(
      "attachment must be a Base64 data URL, such as data:text/plain;base64,..."
    );
  }

  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex < 0) {
    throw new Error("attachment is not a valid data URL: missing comma separator.");
  }

  const metadata = dataUrl.slice(5, commaIndex);
  const metadataParts = metadata.split(";");
  const mimeType = metadataParts[0] || "text/plain";
  if (!metadataParts.slice(1).some((part) => part.toLowerCase() === "base64")) {
    throw new Error("attachment data URL must use Base64 encoding.");
  }

  const encodedContent = dataUrl.slice(commaIndex + 1).replace(/\s/g, "");
  const standardBase64 = encodedContent.replace(/-/g, "+").replace(/_/g, "/");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(standardBase64)) {
    throw new Error("attachment contains invalid Base64 data.");
  }

  const unpaddedContent = standardBase64.replace(/=+$/, "");
  if (unpaddedContent.length % 4 === 1) {
    throw new Error("attachment contains invalid Base64 data.");
  }

  const content = unpaddedContent.padEnd(
    unpaddedContent.length + ((4 - (unpaddedContent.length % 4)) % 4),
    "="
  );

  return { content, extension: extensionForMimeType(mimeType) };
}

function timestampedFileName(date: Date, extension: string): string {
  const timestamp = date.toISOString().replace(/[:.]/g, "-");
  return `${timestamp}.${extension}`;
}

class GitHubUploadPlugin extends NodeBase {
  constructor(state: any) {
    super(state);
  }

  getConfig(): NodeConfig {
    return {
      name: "GitHubUploadPlugin",
      type: "GitHubUploadPlugin",
      description:
        "Upload a Base64 data URL attachment to a public GitHub repository and return a download link.",
      ai_description:
        "Upload the attachment from the incoming request to a GitHub repository. The attachment should be a Base64 data URL such as data:text/plain;base64,... . A missing repository is created as public; an existing private repository is made public so the returned download URL can be accessed without GitHub authentication. The uploaded file is named with the current UTC timestamp and an extension inferred from its MIME type.",
      properties: [
        {
          label: "GitHub Personal Access Token",
          name: "token",
          type: "text",
          required: true,
          default: null,
          ai_description:
            "GitHub token with permission to create repositories, change repository visibility, and write repository contents. Prefer referencing an environment variable.",
        },
        {
          label: "Repository name",
          name: "repositoryName",
          type: "text",
          required: true,
          default: null,
          ai_description:
            "Name of the repository to upload to. If it does not exist, a public repository with this name is created under the authenticated GitHub account, unless an owner is specified.",
        },
        {
          label: "Repository owner (optional)",
          name: "owner",
          type: "text",
          required: false,
          default: null,
          ai_description:
            "Optional GitHub user or organization that owns the repository. Leave empty to use the account associated with the token.",
        },
        {
          label: "Attachment data URL",
          name: "attachment",
          type: "text",
          required: true,
          default: "{{ this.state.request.body.attachment }}",
          ai_description:
            "Base64 data URL from the incoming request, for example {{ this.state.request.body.attachment }} when the body contains { fullName, attachment }. MIME type determines the uploaded file extension.",
        },
      ],
    };
  }

  private async githubRequest(
    token: string,
    path: string,
    options: RequestInit = {}
  ): Promise<GitHubResponse> {
    const response = await fetch(`${GITHUB_API}${path}`, {
      ...options,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
        ...options.headers,
      },
    });

    let data: any = {};
    try {
      data = await response.json();
    } catch {
      // GitHub may return an empty body for some successful responses.
    }

    return { response, data };
  }

  private async ensurePublicRepository(
    token: string,
    owner: string,
    repositoryName: string,
    authenticatedLogin: string
  ): Promise<{ repository: any; created: boolean; madePublic: boolean }> {
    const repositoryPath = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repositoryName)}`;
    const existing = await this.githubRequest(token, repositoryPath);

    let repository: any;
    let created = false;
    let madePublic = false;

    if (existing.response.ok) {
      repository = existing.data;
      if (repository.private) {
        const updated = await this.githubRequest(token, repositoryPath, {
          method: "PATCH",
          body: JSON.stringify({ private: false }),
        });
        if (!updated.response.ok) {
          throw new Error(
            `Could not make repository ${owner}/${repositoryName} public: ${updated.data.message ?? `HTTP ${updated.response.status}`}`
          );
        }
        repository = updated.data;
        madePublic = true;
      }
    } else if (existing.response.status === 404) {
      const creationPath =
        owner.toLowerCase() === authenticatedLogin.toLowerCase()
          ? "/user/repos"
          : `/orgs/${encodeURIComponent(owner)}/repos`;
      const createdRepository = await this.githubRequest(token, creationPath, {
        method: "POST",
        body: JSON.stringify({
          name: repositoryName,
          private: false,
          auto_init: true,
        }),
      });

      if (!createdRepository.response.ok) {
        throw new Error(
          `Could not create public repository ${owner}/${repositoryName}: ${createdRepository.data.message ?? `HTTP ${createdRepository.response.status}`}`
        );
      }

      repository = createdRepository.data;
      created = true;
    } else {
      throw new Error(
        `Could not check repository ${owner}/${repositoryName}: ${existing.data.message ?? `HTTP ${existing.response.status}`}`
      );
    }

    return { repository, created, madePublic };
  }

  async execute(node: NodeInput): Promise<NodeReturn> {
    const settings = node.settings ?? {};
    if (!settings.token) {
      throw new Error(
        "GitHubUploadPlugin: provide a GitHub personal access token."
      );
    }
    if (!settings.repositoryName) {
      throw new Error("GitHubUploadPlugin: provide a repository name.");
    }

    const token = this.parseExpression(String(settings.token)).trim();
    const repositoryName = this.parseExpression(
      String(settings.repositoryName)
    ).trim();
    const ownerSetting = settings.owner
      ? this.parseExpression(String(settings.owner)).trim()
      : "";
    const attachmentValue =
      settings.attachment ?? this.state?.request?.body?.attachment;
    if (attachmentValue === undefined || attachmentValue === null) {
      throw new Error(
        "GitHubUploadPlugin: no attachment was found. Provide a Base64 data URL or set attachment to {{ this.state.request.body.attachment }}."
      );
    }
    const attachment = this.parseExpression(String(attachmentValue)).trim();

    if (!token) {
      throw new Error("GitHubUploadPlugin: the GitHub token cannot be empty.");
    }
    if (!repositoryName) {
      throw new Error("GitHubUploadPlugin: the repository name cannot be empty.");
    }

    try {
      const authenticatedUser = await this.githubRequest(token, "/user");
      if (!authenticatedUser.response.ok) {
        throw new Error(
          `GitHub authentication failed: ${authenticatedUser.data.message ?? `HTTP ${authenticatedUser.response.status}`}`
        );
      }

      const owner = ownerSetting || authenticatedUser.data.login;
      if (!owner) {
        throw new Error("GitHubUploadPlugin: could not determine the repository owner.");
      }

      const { content, extension } = parseBase64DataUrl(attachment);
      const { repository, created, madePublic } =
        await this.ensurePublicRepository(
          token,
          owner,
          repositoryName,
          authenticatedUser.data.login
        );
      const branch = repository.default_branch || "main";
      const fileName = timestampedFileName(new Date(), extension);
      const contentPath = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repositoryName)}/contents/${encodeURIComponent(fileName)}`;
      const upload = await this.githubRequest(token, contentPath, {
        method: "PUT",
        body: JSON.stringify({
          message: `Upload ${fileName}`,
          content,
          branch,
        }),
      });

      if (!upload.response.ok) {
        throw new Error(
          `GitHub file upload failed: ${upload.data.message ?? `HTTP ${upload.response.status}`}`
        );
      }

      const downloadUrl =
        upload.data.content?.download_url ??
        `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repositoryName)}/${encodeURIComponent(branch)}/${encodeURIComponent(fileName)}`;

      return {
        ok: true,
        data: {
          owner,
          repositoryName,
          repositoryUrl:
            repository.html_url ?? `https://github.com/${owner}/${repositoryName}`,
          fileName,
          branch,
          downloadUrl,
          fileUrl: upload.data.content?.html_url ?? null,
          repositoryCreated: created,
          repositoryMadePublic: madePublic,
        },
      };
    } catch (error: any) {
      return { ok: false, error: error?.message ?? String(error) };
    }
  }
}

export default GitHubUploadPlugin;
