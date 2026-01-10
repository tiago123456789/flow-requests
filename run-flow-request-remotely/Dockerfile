FROM denoland/deno:2.6.3

ENV API_KEY=""

EXPOSE 8000

WORKDIR /app

COPY . .

RUN deno install

CMD ["deno", "run", "--allow-all", "main.ts"]
