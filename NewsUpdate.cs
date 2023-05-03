using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEditor;
using Unity.VisualScripting;
using TMPro;
using UnityEngine.SceneManagement;

public class NewsUpdate : MonoBehaviour
{
    public GameObject prefab;

    void OnEnable()
    {
        List<float> scores = new List<float>();
        scores.Add((float)Variables.Saved.Get("currentDelegates"));
        scores.Add((float)Variables.Saved.Get("d_rival1"));
        scores.Add((float)Variables.Saved.Get("d_rival2"));
        scores.Add((float)Variables.Saved.Get("d_rival3"));
        scores.Add((float)Variables.Saved.Get("d_rival4"));
        List<string> names = new List<string>();
        names.Add((string)Variables.Saved.Get("CharacterName"));
        names.Add((string)Variables.Saved.Get("Name1"));
        names.Add((string)Variables.Saved.Get("Name2"));
        names.Add((string)Variables.Saved.Get("Name3"));
        names.Add((string)Variables.Saved.Get("Name4"));
        for (int j = 0; j < scores.Count; j++)
        {
            GameObject instance = Instantiate(prefab, transform);
            TextMeshProUGUI[] allChildren = instance.GetComponentsInChildren<TextMeshProUGUI>();
            allChildren[0].text = names[j];
            allChildren[1].text = Mathf.RoundToInt(scores[j]).ToString();
        }
    }
}

