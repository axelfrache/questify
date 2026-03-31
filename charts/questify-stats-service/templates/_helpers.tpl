{{/*
Expand the name of the chart.
*/}}
{{- define "questify-stats-service.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "questify-stats-service.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "questify-stats-service.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "questify-stats-service.labels" -}}
helm.sh/chart: {{ include "questify-stats-service.chart" . }}
{{ include "questify-stats-service.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "questify-stats-service.selectorLabels" -}}
app.kubernetes.io/name: {{ include "questify-stats-service.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/component: stats
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "questify-stats-service.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "questify-stats-service.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}
