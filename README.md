### Docker/Podman setup

```
podman run --rm -it \
  -v "$HOME/.config/renogy-battery-http:/config:rw" \
  -p 22849:22849 \
  -p 21224:21224 \
  -e LOGLEVEL=debug \
  sdellysse/renogy-battery-http
```
