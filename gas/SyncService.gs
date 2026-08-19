/**
 * Google Apps Script - SyncService.gs
 * Entity routing, Canonical D1 Payload mapping, Idempotency caching, and Execution.
 */

var SyncService = {
  /**
   * Main sync processor for valid envelopes.
   *
   * @param {Object} envelope - The parsed JSON envelope from Cloudflare Worker
   * @returns {Object} Standard JSON response
   */
  processEnvelope: function(envelope) {
    var cache = CacheService.getScriptCache();
    var cacheKey = 'SYNC_REQ_' + envelope.requestId;

    // 1. Check Idempotency Cache
    var cachedState = cache.get(cacheKey);
    if (cachedState === 'SYNCED') {
      return {
        success: true,
        requestId: envelope.requestId,
        syncQueueId: envelope.syncQueueId,
        status: 'SYNCED',
        message: 'Idempotent response: Request already processed.',
        processedRows: 0,
        timestamp: new Date().toISOString()
      };
    }

    // 2. Acquire Script Lock to guarantee serial write safety
    var lock = LockService.getScriptLock();
    var hasLock = lock.tryLock(SYNC_CONFIG.LOCK_TIMEOUT_MS);
    if (!hasLock) {
      return {
        success: false,
        requestId: envelope.requestId,
        syncQueueId: envelope.syncQueueId,
        status: 'FAILED',
        errorCode: 'SPREADSHEET_LOCKED',
        message: 'Could not acquire spreadsheet write lock within timeout window.',
        retryable: true,
        timestamp: new Date().toISOString()
      };
    }

    try {
      var ss = getTargetSpreadsheet(envelope.schoolId);
      var entityConfig = SYNC_CONFIG.SHEETS[envelope.entity];
      if (!entityConfig) {
        throw new Error('Unsupported entity type: ' + envelope.entity);
      }

      var sheet = SpreadsheetRepository.getOrCreateSheet(ss, entityConfig.tabName, entityConfig.headers);
      var processedCount = 0;

      // 3. Route Entity Mappings
      switch (envelope.entity) {
        case 'TEACHER':
          processedCount = this.handleTeacher(sheet, entityConfig.headers, envelope);
          break;
        case 'STUDENT':
          processedCount = this.handleStudent(sheet, entityConfig.headers, envelope);
          break;
        case 'CLASS':
          processedCount = this.handleClass(sheet, entityConfig.headers, envelope);
          break;
        case 'SUBJECT':
          processedCount = this.handleSubject(sheet, entityConfig.headers, envelope);
          break;
        case 'ASSIGNMENT':
          processedCount = this.handleAssignment(sheet, entityConfig.headers, envelope);
          break;
        case 'ATTENDANCE':
          processedCount = this.handleAttendance(sheet, entityConfig.headers, envelope);
          break;
        case 'ASSESSMENT':
          processedCount = this.handleAssessment(sheet, entityConfig.headers, envelope);
          break;
        case 'GRADE':
          processedCount = this.handleGrade(sheet, entityConfig.headers, envelope);
          break;
        case 'JOURNAL':
          processedCount = this.handleJournal(sheet, entityConfig.headers, envelope);
          break;
        default:
          throw new Error('No handler mapped for entity: ' + envelope.entity);
      }

      // 4. Save Idempotency flag in Script Cache
      cache.put(cacheKey, 'SYNCED', SYNC_CONFIG.CACHE_EXPIRY_SECONDS);

      return {
        success: true,
        requestId: envelope.requestId,
        syncQueueId: envelope.syncQueueId,
        status: 'SYNCED',
        processedRows: processedCount,
        timestamp: new Date().toISOString()
      };

    } finally {
      lock.releaseLock();
    }
  },

  handleTeacher: function(sheet, headers, envelope) {
    var p = envelope.payload;
    var row = [
      envelope.entityId || p.id,
      envelope.schoolId,
      p.nip || '',
      p.name || '',
      p.specialization || '',
      (p.is_active === 0 || p.is_active === false) ? 0 : 1,
      envelope.timestamp
    ];
    SpreadsheetRepository.upsertSingleRow(sheet, headers, envelope.entityId || p.id, row);
    return 1;
  },

  handleStudent: function(sheet, headers, envelope) {
    var p = envelope.payload;
    var row = [
      envelope.entityId || p.id,
      envelope.schoolId,
      p.nis || '',
      p.nisn || '',
      p.name || '',
      p.gender || '',
      (p.is_active === 0 || p.is_active === false) ? 0 : 1,
      envelope.timestamp
    ];
    SpreadsheetRepository.upsertSingleRow(sheet, headers, envelope.entityId || p.id, row);
    return 1;
  },

  handleClass: function(sheet, headers, envelope) {
    var p = envelope.payload;
    var row = [
      envelope.entityId || p.id,
      envelope.schoolId,
      p.name || '',
      p.grade_level || '',
      p.academic_year || '',
      (p.is_active === 0 || p.is_active === false) ? 0 : 1,
      envelope.timestamp
    ];
    SpreadsheetRepository.upsertSingleRow(sheet, headers, envelope.entityId || p.id, row);
    return 1;
  },

  handleSubject: function(sheet, headers, envelope) {
    var p = envelope.payload;
    var row = [
      envelope.entityId || p.id,
      envelope.schoolId,
      p.code || '',
      p.name || '',
      p.passing_grade || 75.0,
      (p.is_active === 0 || p.is_active === false) ? 0 : 1,
      envelope.timestamp
    ];
    SpreadsheetRepository.upsertSingleRow(sheet, headers, envelope.entityId || p.id, row);
    return 1;
  },

  handleAssignment: function(sheet, headers, envelope) {
    var p = envelope.payload;
    var row = [
      envelope.entityId || p.id,
      envelope.schoolId,
      p.teacher_id || '',
      p.teacher_name || '',
      p.subject_id || '',
      p.subject_name || '',
      p.class_id || '',
      p.class_name || '',
      p.academic_year || '',
      p.semester || '',
      envelope.timestamp
    ];
    SpreadsheetRepository.upsertSingleRow(sheet, headers, envelope.entityId || p.id, row);
    return 1;
  },

  handleAttendance: function(sheet, headers, envelope) {
    var p = envelope.payload;
    var records = p.records || [];
    if (records.length === 0) return 0;

    var items = [];
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      var recId = r.id || r.recordId || (envelope.entityId + '_' + (r.studentId || i));
      var row = [
        recId,
        p.sessionId || envelope.entityId,
        envelope.schoolId,
        p.date || '',
        p.meetingNo || p.meeting_number || 1,
        p.className || '',
        p.subjectName || '',
        p.teacherName || '',
        p.topic || '',
        r.studentId || '',
        r.studentNis || r.nis || '',
        r.studentName || r.name || '',
        r.status || 'HADIR',
        r.notes || '',
        envelope.timestamp
      ];
      items.push({ pk: recId, values: row });
    }

    var result = SpreadsheetRepository.batchUpsertRows(sheet, headers, items);
    return result.total;
  },

  handleAssessment: function(sheet, headers, envelope) {
    var p = envelope.payload;
    var row = [
      envelope.entityId || p.id,
      envelope.schoolId,
      p.title || '',
      p.assessment_type || p.type || '',
      p.date || '',
      p.passing_grade || p.passingGrade || 75.0,
      p.weight || 1.0,
      p.className || '',
      p.subjectName || '',
      p.teacherName || '',
      envelope.timestamp
    ];
    SpreadsheetRepository.upsertSingleRow(sheet, headers, envelope.entityId || p.id, row);
    return 1;
  },

  handleGrade: function(sheet, headers, envelope) {
    var p = envelope.payload;
    var grades = p.grades || [];
    if (grades.length === 0) return 0;

    var items = [];
    for (var i = 0; i < grades.length; i++) {
      var g = grades[i];
      var gradeId = g.id || g.gradeId || (envelope.entityId + '_' + (g.studentId || i));
      var scoreVal = Number(g.score) || 0;
      var passGrade = Number(p.passingGrade || p.passing_grade || 75.0);
      var isTuntas = scoreVal >= passGrade ? 'TUNTAS' : 'REMEDIAL';

      var row = [
        gradeId,
        p.assessmentId || envelope.entityId,
        envelope.schoolId,
        p.assessmentTitle || p.title || '',
        p.assessmentType || p.type || '',
        p.assessmentDate || p.date || '',
        passGrade,
        p.weight || 1.0,
        p.className || '',
        p.subjectName || '',
        p.teacherName || '',
        g.studentId || '',
        g.studentNis || g.nis || '',
        g.studentName || g.name || '',
        scoreVal,
        isTuntas,
        g.feedback || '',
        envelope.timestamp
      ];
      items.push({ pk: gradeId, values: row });
    }

    var result = SpreadsheetRepository.batchUpsertRows(sheet, headers, items);
    return result.total;
  },

  handleJournal: function(sheet, headers, envelope) {
    var p = envelope.payload;
    var row = [
      envelope.entityId || p.id,
      envelope.schoolId,
      p.date || '',
      p.meeting_number || p.meetingNo || 1,
      p.className || '',
      p.subjectName || '',
      p.teacherName || '',
      p.teaching_material || p.topic || '',
      p.learning_methods || p.method || '',
      p.attendance_summary || '',
      p.class_notes || p.notes || '',
      p.follow_up || '',
      envelope.timestamp
    ];
    SpreadsheetRepository.upsertSingleRow(sheet, headers, envelope.entityId || p.id, row);
    return 1;
  }
};
