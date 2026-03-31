{{- define "rabbitmq.fullname" -}}
{{- printf "%s" .Release.Name | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "rabbitmq.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/name: rabbitmq
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "rabbitmq.selectorLabels" -}}
app.kubernetes.io/name: rabbitmq
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
