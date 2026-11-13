import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    LinearProgress,
    Snackbar,
    Step,
    StepContent,
    StepLabel,
    Stepper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
    IconButton
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Cloud as CloudIcon,
    Delete as DeleteIcon,
    Description as DescriptionIcon,
    Error as ErrorIcon,
    FileUpload as FileUploadIcon,
    Pending as PendingIcon,
    PlayArrow as PlayIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import api from '../../api/axios';
import AdminShell, {
    adminColors,
    goldButtonSx,
    outlineButtonSx,
    panelSx,
    tableContainerSx,
    tableHeadSx
} from '../../components/admin/AdminShell';

const ingestionStepConfig = [
    { id: 'loading', label: 'Chargement des PDFs' },
    { id: 'cleaning', label: 'Nettoyage du texte' },
    { id: 'splitting', label: 'Découpage en segments' },
    { id: 'embeddings', label: 'Génération des embeddings' },
    { id: 'indexing', label: 'Indexation dans Qdrant' },
    { id: 'complete', label: 'Ingestion terminée' }
];

const AdminDocuments = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [ingesting, setIngesting] = useState(false);
    const [ingestionSteps, setIngestionSteps] = useState([]);
    const [ingestionStatus, setIngestionStatus] = useState('idle');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [isDragOver, setIsDragOver] = useState(false);
    const [fileSize, setFileSize] = useState(0);
    const fileInputRef = useRef(null);

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        setLoading(true);
        try {
            const response = await api.get('/admin/documents');
            setDocuments(response.data?.documents || []);
        } catch (error) {
            console.error('Erreur chargement:', error);
            showMessage('Erreur chargement des documents', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const processFile = async (file) => {
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            showMessage('Seuls les fichiers PDF sont acceptés', 'error');
            return;
        }

        const maxFileSize = 200 * 1024 * 1024;
        if (file.size > maxFileSize) {
            showMessage('Fichier trop volumineux (max 200MB)', 'error');
            return;
        }

        setFileSize(file.size);
        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        setUploadProgress(0);

        try {
            const response = await api.post('/admin/documents/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-File-Size': file.size,
                    'X-File-Name': file.name
                },
                timeout: 600000,
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percent);
                }
            });

            showMessage(response.data?.message || 'Upload réussi');
            setUploadProgress(100);
            await loadDocuments();

            setTimeout(() => {
                setUploadProgress(0);
                setFileSize(0);
            }, 2000);
        } catch (error) {
            console.error('Upload error:', error);
            let errorMsg = 'Erreur lors de l\'upload';

            if (error.code === 'ECONNABORTED') {
                errorMsg = 'L\'upload a pris trop de temps. Veuillez réessayer avec un fichier plus petit.';
            } else if (error.response?.status === 413) {
                errorMsg = 'Le fichier est trop volumineux pour le serveur (max 200MB).';
            } else if (error.response?.data?.error) {
                errorMsg = error.response.data.error;
            } else if (error.message) {
                errorMsg = error.message;
            }

            showMessage(errorMsg, 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            processFile(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDelete = async (filename) => {
        if (!window.confirm(`Supprimer "${filename}" ?`)) return;

        try {
            await api.delete(`/admin/documents/${encodeURIComponent(filename)}`);
            showMessage('Document supprimé');
            await loadDocuments();
        } catch (error) {
            console.error('Erreur suppression:', error);
            showMessage('Erreur suppression', 'error');
        }
    };

    const handleIngest = async () => {
        setIngestionSteps(ingestionStepConfig.map((step, index) => ({
            ...step,
            status: index === 0 ? 'running' : 'pending'
        })));
        setIngestionStatus('running');
        setIngesting(true);

        try {
            const response = await api.post('/admin/pipeline/ingest', {}, {
                timeout: 31 * 60 * 1000
            });

            if (response.data?.steps) {
                const updatedSteps = ingestionStepConfig.map(step => {
                    const found = response.data.steps.find(s => s.step === step.id);
                    return {
                        ...step,
                        status: found && found.status === 'done' ? 'done' : 'pending'
                    };
                });
                setIngestionSteps(updatedSteps);
            }

            if (response.data?.success !== false) {
                setIngestionSteps(prev => prev.map(step => ({ ...step, status: 'done' })));
                setIngestionStatus('complete');
                showMessage(response.data?.message || 'Ingestion terminée avec succès');
            } else {
                setIngestionStatus('error');
                showMessage(response.data?.message || 'Erreur lors de l\'ingestion', 'error');
            }

            await loadDocuments();
        } catch (error) {
            console.error('Erreur ingestion:', error);

            let errorMsg = 'Erreur lors de l\'ingestion';
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                errorMsg = 'L\'ingestion prend trop de temps. Vérifiez que Qdrant et Redis sont en cours d\'exécution.';
            } else if (error.response?.data?.error) {
                errorMsg = error.response.data.error;
            }

            setIngestionStatus('error');
            setIngestionSteps(prev => prev.map(s => ({ ...s, status: 'error' })));
            showMessage(errorMsg, 'error');
        } finally {
            setIngesting(false);
        }
    };

    const renderIngestionSteps = () => {
        if (ingestionStatus === 'idle') return null;

        const activeStep = ingestionSteps.findIndex(step => step.status === 'running');
        const StatusIcon = ingestionStatus === 'complete'
            ? CheckCircleIcon
            : ingestionStatus === 'error'
                ? ErrorIcon
                : PendingIcon;

        return (
            <Box sx={{ ...panelSx, mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
                    <StatusIcon sx={{ color: ingestionStatus === 'error' ? adminColors.danger : ingestionStatus === 'complete' ? adminColors.forest : adminColors.gold }} />
                    <Typography variant="h6" sx={{ color: adminColors.ink, fontWeight: 900 }}>Pipeline d'ingestion</Typography>
                    <Chip
                        label={ingestionStatus === 'running' ? 'En cours' : ingestionStatus === 'complete' ? 'Terminé' : 'Erreur'}
                        size="small"
                        sx={{
                            bgcolor: '#e0f2fe',
                            color: ingestionStatus === 'error' ? adminColors.danger : adminColors.gold,
                            fontWeight: 900
                        }}
                    />
                </Box>

                <Stepper
                    orientation="vertical"
                    activeStep={activeStep >= 0 ? activeStep : ingestionSteps.length}
                    sx={{
                        '& .MuiStepConnector-line': { borderColor: adminColors.line },
                        '& .MuiStepLabel-label': { color: adminColors.muted, fontWeight: 700 },
                        '& .Mui-active .MuiStepLabel-label': { color: adminColors.ink, fontWeight: 900 },
                        '& .Mui-completed .MuiStepLabel-label': { color: adminColors.forest, fontWeight: 900 }
                    }}
                >
                    {ingestionSteps.map((step) => (
                        <Step key={step.id} active={step.status === 'running'} completed={step.status === 'done'}>
                            <StepLabel
                                StepIconComponent={() => (
                                    <Box sx={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {step.status === 'done' && <CheckCircleIcon sx={{ fontSize: 20, color: adminColors.forest }} />}
                                        {step.status === 'running' && <CircularProgress size={18} sx={{ color: adminColors.gold }} />}
                                        {step.status === 'error' && <ErrorIcon sx={{ fontSize: 20, color: adminColors.danger }} />}
                                        {step.status === 'pending' && <Box sx={{ width: 10, height: 10, borderRadius: '50%', border: `2px solid ${adminColors.line}` }} />}
                                    </Box>
                                )}
                            >
                                {step.label}
                            </StepLabel>
                            <StepContent>
                                <Typography variant="caption" sx={{ color: adminColors.muted }}>
                                    {step.status === 'pending' && 'En attente'}
                                    {step.status === 'running' && 'Traitement en cours'}
                                    {step.status === 'done' && 'Terminé'}
                                    {step.status === 'error' && 'Erreur'}
                                </Typography>
                            </StepContent>
                        </Step>
                    ))}
                </Stepper>

                {ingestionStatus === 'running' && (
                    <Box sx={{ mt: 2 }}>
                        <LinearProgress sx={{ height: 6, borderRadius: '8px', bgcolor: '#e0f2fe', '& .MuiLinearProgress-bar': { bgcolor: adminColors.gold } }} />
                        <Typography variant="caption" sx={{ color: adminColors.muted, mt: 1, display: 'block' }}>
                            Traitement en cours. Cette opération peut prendre plusieurs minutes.
                        </Typography>
                    </Box>
                )}
            </Box>
        );
    };

    return (
        <AdminShell
            active="documents"
            title="Gestion des documents"
            subtitle="Ajout, indexation et surveillance des PDF qui alimentent la base de connaissances juridique."
            badge={<Chip label={`${documents.length} PDF`} size="small" sx={{ bgcolor: '#e0f2fe', color: adminColors.forest, fontWeight: 900 }} />}
            actions={(
                <>
                    <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleFileSelect} />
                    <Button
                        variant="contained"
                        startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <FileUploadIcon />}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || ingesting}
                        sx={goldButtonSx}
                    >
                        {uploading ? `Upload ${uploadProgress}%` : 'Sélectionner un PDF'}
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={ingesting ? <CircularProgress size={18} color="inherit" /> : <PlayIcon />}
                        onClick={handleIngest}
                        disabled={ingesting || uploading}
                        sx={{ ...goldButtonSx, bgcolor: adminColors.gold, color: '#FFFFFF', '&:hover': { bgcolor: '#4F46E5' } }}
                    >
                        {ingesting ? 'Ingestion...' : 'Ingérer'}
                    </Button>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadDocuments} disabled={loading} sx={outlineButtonSx}>
                        Rafraîchir
                    </Button>
                </>
            )}
        >
            {renderIngestionSteps()}

            <Box
                sx={{
                    ...panelSx,
                    mb: 2.5,
                    border: isDragOver ? `2px dashed ${adminColors.forest}` : '1px dashed #7dd3fc',
                    bgcolor: isDragOver ? '#e0f2fe' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 180ms ease'
                }}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.4 }}>
                    <CloudIcon sx={{ fontSize: 58, color: isDragOver ? adminColors.gold : adminColors.forest }} />
                    <Typography variant="h6" sx={{ color: adminColors.ink, fontWeight: 900 }}>
                        {isDragOver ? 'Déposez votre PDF ici' : 'Glissez-déposez votre PDF ici'}
                    </Typography>
                    <Typography sx={{ color: adminColors.muted }}>ou cliquez pour sélectionner un fichier</Typography>
                    <Typography variant="caption" sx={{ color: adminColors.muted, fontWeight: 700 }}>PDF uniquement, jusqu'à 200MB</Typography>

                    {uploading && (
                        <Box sx={{ width: '100%', maxWidth: 460, mt: 1.5 }}>
                            <LinearProgress
                                variant="determinate"
                                value={uploadProgress}
                                sx={{ height: 8, borderRadius: '8px', bgcolor: '#e0f2fe', '& .MuiLinearProgress-bar': { bgcolor: adminColors.gold } }}
                            />
                            <Typography variant="caption" sx={{ color: adminColors.muted, mt: 1, display: 'block' }}>
                                Upload en cours... {uploadProgress}% {fileSize > 0 && `(${(fileSize * uploadProgress / 100 / 1024 / 1024).toFixed(2)} MB / ${(fileSize / 1024 / 1024).toFixed(2)} MB)`}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress sx={{ color: adminColors.gold }} />
                </Box>
            ) : (
                <TableContainer component={Box} sx={tableContainerSx}>
                    <Table>
                        <TableHead sx={tableHeadSx}>
                            <TableRow>
                                <TableCell>Nom</TableCell>
                                <TableCell>Taille</TableCell>
                                <TableCell>Modifié</TableCell>
                                <TableCell align="center">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {documents.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                                        <Typography sx={{ color: adminColors.muted, fontWeight: 700 }}>Aucun document PDF</Typography>
                                        <Typography variant="caption" sx={{ color: adminColors.muted }}>Déposez un PDF dans la zone ci-dessus.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                documents.map((doc) => (
                                    <TableRow
                                        key={doc.name}
                                        hover
                                        sx={{
                                            '& .MuiTableCell-root': { borderBottom: `1px solid ${adminColors.line}` },
                                            '&:hover': { bgcolor: '#f0f9ff' }
                                        }}
                                    >
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, minWidth: 0 }}>
                                                <DescriptionIcon sx={{ color: adminColors.gold }} />
                                                <Typography sx={{ color: adminColors.ink, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ color: adminColors.muted }}>{doc.size_mb} MB</TableCell>
                                        <TableCell sx={{ color: adminColors.muted }}>{doc.modified}</TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Supprimer">
                                                <IconButton size="small" onClick={() => handleDelete(doc.name)} sx={{ color: adminColors.danger, '&:hover': { bgcolor: '#e0f2fe' } }}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} variant="filled" sx={{ borderRadius: '8px' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </AdminShell>
    );
};

export default AdminDocuments;
